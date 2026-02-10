import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/youtube/channel-videos
 * Returns paginated list of user's channel videos with analysis status.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const shortsOnly = searchParams.get('shortsOnly') === 'true';
  const unanalyzedOnly = searchParams.get('unanalyzedOnly') === 'true';
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from('channel_videos')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (shortsOnly) {
    query = query.eq('is_short', true);
  }

  if (unanalyzedOnly) {
    query = query.is('analysis_job_id', null);
  }

  const { data: videos, count, error } = await query;

  if (error) {
    console.error('Failed to fetch channel videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    items: videos || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
