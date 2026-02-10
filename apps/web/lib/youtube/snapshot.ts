import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Captures a daily channel stats snapshot for the given user.
 * Idempotent: if today's snapshot already exists, it does nothing.
 */
export async function captureChannelSnapshot(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if today's snapshot already exists
  const { data: existing } = await supabase
    .from('channel_stats_snapshots')
    .select('id')
    .eq('user_id', userId)
    .eq('snapshot_date', today)
    .maybeSingle();

  if (existing) {
    return false; // Already captured today
  }

  // Get channel connection info (subscriber_count, video_count)
  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('subscriber_count, video_count')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!connection) {
    return false; // No active connection
  }

  // Get aggregated stats from channel_videos (shorts only)
  const { data: shorts } = await supabase
    .from('channel_videos')
    .select('view_count, like_count, comment_count')
    .eq('user_id', userId)
    .eq('is_short', true);

  const shortsArr = shorts || [];
  const totalViews = shortsArr.reduce((sum, v) => sum + (v.view_count || 0), 0);
  const totalLikes = shortsArr.reduce((sum, v) => sum + (v.like_count || 0), 0);
  const totalComments = shortsArr.reduce((sum, v) => sum + (v.comment_count || 0), 0);

  const avgViews = shortsArr.length > 0 ? Math.round(totalViews / shortsArr.length) : null;
  const avgLikes = shortsArr.length > 0 ? Math.round(totalLikes / shortsArr.length) : null;
  const avgComments = shortsArr.length > 0 ? Math.round(totalComments / shortsArr.length) : null;

  // Insert snapshot
  const { error } = await supabase
    .from('channel_stats_snapshots')
    .insert({
      user_id: userId,
      subscriber_count: connection.subscriber_count || 0,
      video_count: connection.video_count || 0,
      total_views: totalViews,
      total_shorts_count: shortsArr.length,
      avg_short_views: avgViews,
      avg_short_likes: avgLikes,
      avg_short_comments: avgComments,
      snapshot_date: today,
    });

  if (error) {
    // Unique constraint violation means it was just inserted by another request
    if (error.code === '23505') return false;
    console.error('Failed to capture snapshot:', error);
    return false;
  }

  return true;
}
