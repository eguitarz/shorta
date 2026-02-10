import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser, validateCsrf } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';
import { getAccessToken, fetchChannelVideos, fetchVideoRetention, extractVideoId } from '@/lib/youtube/client';
import { detectChannelNiche } from '@/lib/youtube/niche-detection';
import { analyzeMonetization } from '@/lib/youtube/monetization-analysis';
import type { VideoSyncResult } from '@/lib/youtube/types';
import { captureChannelSnapshot } from '@/lib/youtube/snapshot';

export const dynamic = 'force-dynamic';

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * POST /api/youtube/sync-videos
 * Syncs the user's YouTube channel videos to the database.
 * Uses cached data if synced within 1 hour (skips YouTube API).
 * Always re-runs niche detection.
 * Pass ?force=true to force a fresh YouTube API fetch.
 */
export async function POST(request: NextRequest) {
  // CSRF check
  const csrfResult = validateCsrf(request);
  if (!csrfResult.isValid) {
    return NextResponse.json({ error: csrfResult.error }, { status: 403 });
  }

  // Auth check
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const forceRefresh = request.nextUrl.searchParams.get('force') === 'true';
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  try {
    const supabase = createServiceClient();

    // Check if we have fresh cached data
    const { data: connection } = await supabase
      .from('youtube_connections')
      .select('last_video_sync_at')
      .eq('user_id', user.id)
      .single();

    const lastSync = connection?.last_video_sync_at;
    const isFresh = lastSync && (Date.now() - new Date(lastSync).getTime() < ONE_HOUR_MS);
    const useCache = isFresh && !forceRefresh;

    let totalCount = 0;
    let shortsCount = 0;
    let linkedCount = 0;
    let shortsForNiche: Array<{ title: string; description: string }> = [];
    let shortsStats: Array<{ viewCount: number; likeCount: number; commentCount: number }> = [];

    if (useCache) {
      console.log('[sync-videos] Using cached data (last sync:', lastSync, ')');

      // Read cached videos from DB
      const { data: cachedVideos } = await supabase
        .from('channel_videos')
        .select('title, is_short, view_count, like_count, comment_count')
        .eq('user_id', user.id);

      if (cachedVideos) {
        totalCount = cachedVideos.length;
        const shorts = cachedVideos.filter((v) => v.is_short);
        shortsCount = shorts.length;
        shortsForNiche = shorts.map((v) => ({ title: v.title, description: '' }));
        shortsStats = shorts.map((v) => ({
          viewCount: v.view_count || 0,
          likeCount: v.like_count || 0,
          commentCount: v.comment_count || 0,
        }));
      }
    } else {
      console.log('[sync-videos] Fetching fresh data from YouTube API');

      // Get valid access token
      const accessToken = await getAccessToken(user.id);
      if (!accessToken) {
        return NextResponse.json(
          { error: 'YouTube not connected or token expired' },
          { status: 400 }
        );
      }

      // Fetch videos from YouTube
      const videos = await fetchChannelVideos(accessToken);
      totalCount = videos.length;

      // Fetch retention metrics for shorts from YouTube Analytics API
      const shortVideoIds = videos.filter((v) => v.isShort).map((v) => v.videoId);
      let retentionMap = new Map<string, { avgViewDuration: number; avgViewPercentage: number }>();
      if (shortVideoIds.length > 0) {
        console.log(`[sync-videos] Fetching retention metrics for ${shortVideoIds.length} shorts`);
        retentionMap = await fetchVideoRetention(accessToken, shortVideoIds);
        console.log(`[sync-videos] Got retention data for ${retentionMap.size} shorts`);
      }

      // Upsert videos into channel_videos
      for (const video of videos) {
        const retention = retentionMap.get(video.videoId);
        const { error } = await supabase
          .from('channel_videos')
          .upsert(
            {
              user_id: user.id,
              youtube_video_id: video.videoId,
              title: video.title,
              thumbnail_url: video.thumbnailUrl,
              published_at: video.publishedAt,
              duration_seconds: video.durationSeconds,
              is_short: video.isShort,
              view_count: video.viewCount,
              like_count: video.likeCount,
              comment_count: video.commentCount,
              privacy_status: video.privacyStatus,
              avg_view_duration_seconds: retention?.avgViewDuration ?? null,
              avg_view_percentage: retention?.avgViewPercentage ?? null,
              synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,youtube_video_id' }
          );

        if (error) {
          console.error('Failed to upsert video:', video.videoId, error);
        }
      }

      // Auto-link to existing analysis_jobs by matching youtube_video_id
      const videoIds = videos.map((v) => v.videoId);
      if (videoIds.length > 0) {
        const { data: matchingJobs } = await supabase
          .from('analysis_jobs')
          .select('id, youtube_video_id')
          .eq('user_id', user.id)
          .in('youtube_video_id', videoIds)
          .eq('status', 'completed');

        if (matchingJobs) {
          for (const job of matchingJobs) {
            const { error } = await supabase
              .from('channel_videos')
              .update({ analysis_job_id: job.id })
              .eq('user_id', user.id)
              .eq('youtube_video_id', job.youtube_video_id);

            if (!error) linkedCount++;
          }
        }

        // Also try matching by video URL in analysis_jobs
        const { data: allJobs } = await supabase
          .from('analysis_jobs')
          .select('id, video_url')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .is('youtube_video_id', null);

        if (allJobs) {
          for (const job of allJobs) {
            const jobVideoId = extractVideoId(job.video_url);
            if (jobVideoId && videoIds.includes(jobVideoId)) {
              await supabase
                .from('analysis_jobs')
                .update({ youtube_video_id: jobVideoId })
                .eq('id', job.id);

              const { error } = await supabase
                .from('channel_videos')
                .update({ analysis_job_id: job.id })
                .eq('user_id', user.id)
                .eq('youtube_video_id', jobVideoId);

              if (!error) linkedCount++;
            }
          }
        }
      }

      // Update last_video_sync_at
      await supabase
        .from('youtube_connections')
        .update({
          last_video_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      const shorts = videos.filter((v) => v.isShort);
      shortsCount = shorts.length;
      shortsForNiche = shorts.map((v) => ({ title: v.title, description: v.description }));
      shortsStats = shorts.map((v) => ({
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        commentCount: v.commentCount,
      }));
    }

    // Always run niche detection if enough shorts
    console.log(`[sync-videos] Total videos: ${totalCount}, Shorts: ${shortsCount}, cached: ${useCache}`);
    if (shortsForNiche.length >= 3) {
      console.log('[sync-videos] Running niche detection...');
      try {
        const nicheResult = await detectChannelNiche(shortsForNiche, locale);
        console.log('[sync-videos] Niche detection result:', nicheResult ? JSON.stringify(nicheResult).slice(0, 200) : 'null');

        if (nicheResult) {
          const totalViews = shortsStats.reduce((sum, v) => sum + v.viewCount, 0);
          const totalEngagement = shortsStats.reduce(
            (sum, v) => sum + v.likeCount + v.commentCount,
            0
          );

          await supabase
            .from('channel_profiles')
            .upsert(
              {
                user_id: user.id,
                primary_niche: nicheResult.primaryNiche,
                secondary_niches: nicheResult.secondaryNiches,
                niche_confidence: nicheResult.nicheConfidence,
                niche_reasoning: nicheResult.reasoning,
                primary_format: nicheResult.primaryFormat,
                target_audience: nicheResult.targetAudience,
                content_themes: nicheResult.contentThemes,
                avg_view_count: Math.round(totalViews / shortsForNiche.length),
                avg_engagement_rate:
                  totalViews > 0 ? totalEngagement / totalViews : 0,
                analyzed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
          console.log('[sync-videos] Channel profile upserted successfully');

          // Run monetization analysis after niche detection
          try {
            console.log('[sync-videos] Running monetization analysis...');
            // Fetch subscriber count from youtube_connections
            const { data: connData } = await supabase
              .from('youtube_connections')
              .select('subscriber_count')
              .eq('user_id', user.id)
              .single();

            const avgViewCount = Math.round(
              shortsStats.reduce((sum, v) => sum + v.viewCount, 0) / shortsForNiche.length
            );

            const monetizationResult = await analyzeMonetization({
              primaryNiche: nicheResult.primaryNiche,
              secondaryNiches: nicheResult.secondaryNiches,
              contentThemes: nicheResult.contentThemes,
              targetAudience: nicheResult.targetAudience,
              avgViewCount,
              subscriberCount: connData?.subscriber_count || 0,
              locale,
            });

            if (monetizationResult) {
              await supabase
                .from('channel_profiles')
                .update({ monetization_analysis: monetizationResult })
                .eq('user_id', user.id);
              console.log('[sync-videos] Monetization analysis stored successfully');
            }
          } catch (monetizationError) {
            console.error('[sync-videos] Monetization analysis failed:', monetizationError);
          }
        }
      } catch (nicheError) {
        console.error('[sync-videos] Niche detection failed:', nicheError);
      }
    } else {
      console.log(`[sync-videos] Skipping niche detection: only ${shortsCount} shorts (need 3)`);
    }

    // Capture daily snapshot (non-blocking)
    if (!useCache) {
      try {
        await captureChannelSnapshot(user.id, supabase);
      } catch (snapshotError) {
        console.error('Snapshot capture failed:', snapshotError);
      }
    }

    const result: VideoSyncResult = {
      synced: totalCount,
      shorts: shortsCount,
      linked: linkedCount,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Video sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync videos' },
      { status: 500 }
    );
  }
}
