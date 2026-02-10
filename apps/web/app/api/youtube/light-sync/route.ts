import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateCsrf } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';
import { getAccessToken, fetchVideosByIds, extractVideoId } from '@/lib/youtube/client';
import { checkNewVideosViaRss } from '@/lib/youtube/rss-check';

export const dynamic = 'force-dynamic';

/**
 * POST /api/youtube/light-sync
 *
 * Lightweight sync that uses YouTube's free RSS feed to detect new videos,
 * then fetches only those videos via the YouTube API (1 quota unit per video).
 *
 * Typical cost: 1 unit for 1 new video, vs ~600 units for a full sync.
 */
export async function POST(request: NextRequest) {
  const csrfResult = validateCsrf(request);
  if (!csrfResult.isValid) {
    return NextResponse.json({ error: csrfResult.error }, { status: 403 });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // Get user's channel_id from youtube_connections
    const { data: connection } = await supabase
      .from('youtube_connections')
      .select('channel_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!connection?.channel_id) {
      return NextResponse.json({ found: 0, synced: 0 });
    }

    // Get existing video IDs from channel_videos
    const { data: existingVideos } = await supabase
      .from('channel_videos')
      .select('youtube_video_id')
      .eq('user_id', user.id);

    const existingVideoIds = new Set(
      (existingVideos || []).map((v) => v.youtube_video_id)
    );

    // Check RSS feed for new videos (0 API quota)
    const newVideoIds = await checkNewVideosViaRss(
      connection.channel_id,
      existingVideoIds
    );

    if (newVideoIds.length === 0) {
      return NextResponse.json({ found: 0, synced: 0 });
    }

    console.log(`[light-sync] Found ${newVideoIds.length} new video(s), fetching details...`);

    // Get access token and fetch video details (1 quota unit per video)
    const accessToken = await getAccessToken(user.id);
    if (!accessToken) {
      console.error('[light-sync] No valid access token');
      return NextResponse.json({ found: newVideoIds.length, synced: 0 });
    }

    const videos = await fetchVideosByIds(accessToken, newVideoIds);

    // Upsert new videos into channel_videos
    let syncedCount = 0;
    for (const video of videos) {
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
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,youtube_video_id' }
        );

      if (error) {
        console.error('[light-sync] Failed to upsert video:', video.videoId, error);
      } else {
        syncedCount++;
      }
    }

    // Auto-link to existing analysis_jobs
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
          await supabase
            .from('channel_videos')
            .update({ analysis_job_id: job.id })
            .eq('user_id', user.id)
            .eq('youtube_video_id', job.youtube_video_id);
        }
      }

      // Also match by video URL
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

            await supabase
              .from('channel_videos')
              .update({ analysis_job_id: job.id })
              .eq('user_id', user.id)
              .eq('youtube_video_id', jobVideoId);
          }
        }
      }
    }

    console.log(`[light-sync] Synced ${syncedCount} new video(s)`);
    return NextResponse.json({ found: newVideoIds.length, synced: syncedCount });
  } catch (error) {
    console.error('[light-sync] Error:', error);
    return NextResponse.json({ found: 0, synced: 0 });
  }
}
