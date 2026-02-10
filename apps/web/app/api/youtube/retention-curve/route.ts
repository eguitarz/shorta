import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';
import { getAccessToken, fetchRetentionCurve } from '@/lib/youtube/client';
import type { RetentionCurvePoint } from '@/lib/youtube/types';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * GET /api/youtube/retention-curve?videoId=XYZ&refresh=true
 *
 * Always returns cached data if available (fast path).
 * Only calls YouTube Analytics API when:
 *   - No cache exists at all (first fetch)
 *   - refresh=true (explicit user action)
 *
 * Gracefully returns { data: null } on any failure.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ data: null });
  }

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const refresh = searchParams.get('refresh') === 'true';

  if (!videoId) {
    return NextResponse.json({ data: null });
  }

  try {
    const supabase = createServiceClient();

    // 1. Ownership check: does the user own this video?
    const { data: channelVideo } = await supabase
      .from('channel_videos')
      .select('youtube_video_id')
      .eq('user_id', user.id)
      .eq('youtube_video_id', videoId)
      .maybeSingle();

    if (!channelVideo) {
      return NextResponse.json({ data: null });
    }

    // 2. Cache check
    const { data: cached } = await supabase
      .from('video_retention_curves')
      .select('*')
      .eq('user_id', user.id)
      .eq('youtube_video_id', videoId)
      .maybeSingle();

    // 3. Return cache immediately unless explicit refresh requested
    if (cached && !refresh) {
      const fetchedAt = new Date(cached.fetched_at).getTime();
      const isFresh = Date.now() - fetchedAt < CACHE_TTL_MS;

      return NextResponse.json({
        data: {
          youtubeVideoId: videoId,
          curveData: cached.curve_data as RetentionCurvePoint[],
          fetchedAt: cached.fetched_at,
          isFresh,
        },
      });
    }

    // 4. No cache or explicit refresh — fetch from YouTube Analytics API
    const accessToken = await getAccessToken(user.id);
    if (!accessToken) {
      if (cached) {
        return NextResponse.json({
          data: {
            youtubeVideoId: videoId,
            curveData: cached.curve_data as RetentionCurvePoint[],
            fetchedAt: cached.fetched_at,
            isFresh: false,
          },
        });
      }
      return NextResponse.json({ data: null });
    }

    const curveData = await fetchRetentionCurve(accessToken, videoId);
    if (!curveData) {
      if (cached) {
        return NextResponse.json({
          data: {
            youtubeVideoId: videoId,
            curveData: cached.curve_data as RetentionCurvePoint[],
            fetchedAt: cached.fetched_at,
            isFresh: false,
          },
        });
      }
      return NextResponse.json({ data: null });
    }

    // 5. Upsert cache
    const now = new Date().toISOString();
    await supabase
      .from('video_retention_curves')
      .upsert(
        {
          user_id: user.id,
          youtube_video_id: videoId,
          curve_data: curveData,
          fetched_at: now,
        },
        { onConflict: 'user_id,youtube_video_id' }
      );

    return NextResponse.json({
      data: {
        youtubeVideoId: videoId,
        curveData,
        fetchedAt: now,
        isFresh: true,
      },
    });
  } catch (error) {
    console.error('[retention-curve] Error:', error);
    return NextResponse.json({ data: null });
  }
}
