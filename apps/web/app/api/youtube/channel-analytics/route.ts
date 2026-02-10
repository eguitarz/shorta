import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';
import type { WeekOverWeekChanges, MetricChange, RetentionMetrics } from '@/lib/youtube/types';

export const dynamic = 'force-dynamic';

function calcChange(current: number, previous: number | null): MetricChange {
  if (previous === null) {
    return { current, previous: null, delta: null, percentChange: null };
  }
  const delta = current - previous;
  const percentChange = previous !== 0 ? (delta / previous) * 100 : null;
  return { current, previous, delta, percentChange };
}

/**
 * GET /api/youtube/channel-analytics
 * Returns combined channel analytics: profile, connection info, stats,
 * week-over-week changes, and historical snapshots.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // Fetch channel profile (niche info)
    const { data: profile } = await supabase
      .from('channel_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch youtube connection
    const { data: connection } = await supabase
      .from('youtube_connections')
      .select('channel_id, channel_title, channel_thumbnail_url, subscriber_count, video_count, status, last_video_sync_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const connectionInfo = connection ? {
      connected: connection.status === 'active',
      channelId: connection.channel_id,
      channelTitle: connection.channel_title,
      channelThumbnail: connection.channel_thumbnail_url,
      subscriberCount: connection.subscriber_count,
      videoCount: connection.video_count,
      status: connection.status,
      lastVideoSync: connection.last_video_sync_at,
    } : null;

    // Fetch video counts
    const { count: totalVideos } = await supabase
      .from('channel_videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: shortsCount } = await supabase
      .from('channel_videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_short', true);

    const { count: analyzedCount } = await supabase
      .from('channel_videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('analysis_job_id', 'is', null);

    // Fetch snapshots: today and 7 days ago for w/w changes
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: todaySnapshot } = await supabase
      .from('channel_stats_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('snapshot_date', today)
      .maybeSingle();

    const { data: weekAgoSnapshot } = await supabase
      .from('channel_stats_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('snapshot_date', sevenDaysAgo)
      .maybeSingle();

    // Calculate w/w changes
    let weekOverWeekChanges: WeekOverWeekChanges | null = null;
    if (todaySnapshot) {
      const prev = weekAgoSnapshot;
      weekOverWeekChanges = {
        subscribers: calcChange(
          todaySnapshot.subscriber_count,
          prev?.subscriber_count ?? null
        ),
        totalViews: calcChange(
          todaySnapshot.total_views,
          prev?.total_views ?? null
        ),
        avgShortViews: calcChange(
          todaySnapshot.avg_short_views || 0,
          prev?.avg_short_views ?? null
        ),
        engagementRate: calcChange(0, null),
      };
    }

    // Fetch last 30 days of snapshots for historical display
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: historicalSnapshots } = await supabase
      .from('channel_stats_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .gte('snapshot_date', thirtyDaysAgo)
      .order('snapshot_date', { ascending: true });

    // Fetch top performing shorts (by view count)
    const { data: topShorts } = await supabase
      .from('channel_videos')
      .select('youtube_video_id, title, thumbnail_url, view_count, like_count, comment_count, published_at, analysis_job_id, privacy_status, avg_view_duration_seconds, avg_view_percentage')
      .eq('user_id', user.id)
      .eq('is_short', true)
      .order('view_count', { ascending: false })
      .limit(3);

    // Fetch unanalyzed shorts (last 30 days only)
    const thirtyDaysAgoISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: unanalyzedShorts } = await supabase
      .from('channel_videos')
      .select('youtube_video_id, title, thumbnail_url, view_count, like_count, comment_count, published_at, analysis_job_id, privacy_status, avg_view_duration_seconds, avg_view_percentage')
      .eq('user_id', user.id)
      .eq('is_short', true)
      .is('analysis_job_id', null)
      .gte('published_at', thirtyDaysAgoISO)
      .order('published_at', { ascending: false })
      .limit(3);

    // Compute retention metrics from shorts with retention data
    let retentionMetrics: RetentionMetrics | null = null;
    const { data: retentionData } = await supabase
      .from('channel_videos')
      .select('youtube_video_id, title, thumbnail_url, view_count, like_count, comment_count, published_at, analysis_job_id, privacy_status, avg_view_duration_seconds, avg_view_percentage')
      .eq('user_id', user.id)
      .eq('is_short', true)
      .not('avg_view_percentage', 'is', null);

    if (retentionData && retentionData.length > 0) {
      // View-weighted average: videos with more views contribute proportionally more
      const totalWeightedPercentage = retentionData.reduce(
        (sum, v) => sum + (v.avg_view_percentage || 0) * (v.view_count || 1), 0
      );
      const totalViews = retentionData.reduce((sum, v) => sum + (v.view_count || 1), 0);
      const avgCompletionRate = Math.round((totalWeightedPercentage / totalViews) * 100) / 100;

      // Sort by retention for top/bottom
      const sorted = [...retentionData].sort((a, b) => (b.avg_view_percentage || 0) - (a.avg_view_percentage || 0));

      retentionMetrics = {
        avgCompletionRate,
        totalShortsWithData: retentionData.length,
        topRetention: sorted.slice(0, 3),
        lowestRetention: sorted.slice(-3).reverse(),
      };
    }

    // Compute current engagement rate from shorts with views
    const { data: engagementData } = await supabase
      .from('channel_videos')
      .select('view_count, like_count, comment_count')
      .eq('user_id', user.id)
      .eq('is_short', true)
      .gt('view_count', 0);

    let currentEngagementRate = 0;
    if (engagementData && engagementData.length > 0) {
      const totalInteractions = engagementData.reduce((sum, v) => sum + (v.like_count || 0) + (v.comment_count || 0), 0);
      const totalViewsForEngagement = engagementData.reduce((sum, v) => sum + v.view_count, 0);
      if (totalViewsForEngagement > 0) {
        currentEngagementRate = (totalInteractions / totalViewsForEngagement) * 100;
      }
    }

    // Add engagement rate to w/w changes
    if (weekOverWeekChanges) {
      const todayEngRate = currentEngagementRate;
      let prevEngRate: number | null = null;
      if (weekAgoSnapshot && weekAgoSnapshot.avg_short_views && weekAgoSnapshot.avg_short_views > 0) {
        const prevLikes = weekAgoSnapshot.avg_short_likes || 0;
        const prevComments = weekAgoSnapshot.avg_short_comments || 0;
        prevEngRate = ((prevLikes + prevComments) / weekAgoSnapshot.avg_short_views) * 100;
      }
      weekOverWeekChanges.engagementRate = calcChange(todayEngRate, prevEngRate);
    }

    return NextResponse.json({
      profile,
      connection: connectionInfo,
      stats: {
        totalVideos: totalVideos || 0,
        shortsCount: shortsCount || 0,
        analyzedCount: analyzedCount || 0,
      },
      weekOverWeekChanges,
      historicalSnapshots: historicalSnapshots || [],
      topShorts: topShorts || [],
      unanalyzedShorts: unanalyzedShorts || [],
      retentionMetrics,
    });
  } catch (error) {
    console.error('Channel analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
