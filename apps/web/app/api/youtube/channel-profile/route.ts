import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/youtube/channel-profile
 * Returns the user's channel profile including niche detection results.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Fetch channel profile
  const { data: profile } = await supabase
    .from('channel_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

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

  return NextResponse.json({
    profile: profile || null,
    stats: {
      totalVideos: totalVideos || 0,
      shortsCount: shortsCount || 0,
      analyzedCount: analyzedCount || 0,
    },
  });
}
