import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase-service';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// All selectable columns for the library table
const SELECTABLE_COLUMNS = [
  // Basic
  'id', 'title', 'video_url', 'file_uri', 'video_duration', 'created_at', 'starred',
  // Overall scores
  'deterministic_score', 'hook_strength', 'structure_pacing', 'value_clarity', 'delivery_performance', 'lint_score',
  // Metadata
  'video_format', 'niche_category', 'content_type', 'hook_category', 'hook_pattern', 'target_audience',
  // Hook submetrics
  'hook_tt_claim', 'hook_pb', 'hook_spec', 'hook_qc',
  // Structure submetrics
  'structure_bc', 'structure_pm', 'structure_pp', 'structure_lc',
  // Clarity submetrics
  'clarity_word_count', 'clarity_score_wps', 'clarity_sc', 'clarity_tj', 'clarity_rd',
  // Delivery submetrics
  'delivery_filler_count', 'delivery_pause_count', 'delivery_ls', 'delivery_ns', 'delivery_ec',
] as const;

/**
 * GET /api/library
 * Fetch library items with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Filters
    const starred = searchParams.get('starred');
    const search = searchParams.get('search');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const niches = searchParams.get('niches')?.split(',').filter(Boolean);
    const hookTypes = searchParams.get('hookTypes')?.split(',').filter(Boolean);
    const contentTypes = searchParams.get('contentTypes')?.split(',').filter(Boolean);
    const formats = searchParams.get('formats')?.split(',').filter(Boolean);

    // Source filter: 'all' (default) | 'analyzed' | 'own' | 'own_unanalyzed'
    const source = searchParams.get('source') || 'all';

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // API route - ignore cookie setting errors
            }
          },
        },
      }
    );

    // Handle own_unanalyzed: return unanalyzed channel videos
    if (source === 'own_unanalyzed') {
      const serviceClient = createServiceClient();
      let ownQuery = serviceClient
        .from('channel_videos')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_short', true)
        .is('analysis_job_id', null)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        ownQuery = ownQuery.ilike('title', `%${search}%`);
      }

      const { data: ownVideos, count: ownCount, error: ownError } = await ownQuery;

      if (ownError) {
        console.error('[Library] Own videos query error:', ownError);
        return NextResponse.json({ error: 'Failed to fetch own videos' }, { status: 500 });
      }

      // Map to library item format
      const items = (ownVideos || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        video_url: `https://youtube.com/shorts/${v.youtube_video_id}`,
        video_duration: v.duration_seconds,
        created_at: v.published_at,
        starred: false,
        is_own_video: true,
        youtube_video_id: v.youtube_video_id,
        youtube_view_count: v.view_count,
        youtube_like_count: v.like_count,
        analysis_status: 'unanalyzed' as const,
        thumbnail_url: v.thumbnail_url,
        privacy_status: v.privacy_status || 'public',
      }));

      return NextResponse.json({
        items,
        total: ownCount || 0,
        page,
        limit,
        totalPages: Math.ceil((ownCount || 0) / limit),
      });
    }

    // Build query for analyzed items
    let query = supabase
      .from('analysis_jobs')
      .select(SELECTABLE_COLUMNS.join(',') + ',youtube_video_id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed'); // Only show completed analyses

    // For 'own' source, only show analysis_jobs that have a youtube_video_id (own analyzed videos)
    if (source === 'own') {
      query = query.not('youtube_video_id', 'is', null);
    }

    // For 'uploaded' source, only show analysis_jobs with a file_uri (file uploads)
    if (source === 'uploaded') {
      query = query.not('file_uri', 'is', null);
    }

    // Apply filters
    if (starred === 'true') {
      query = query.eq('starred', true);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (minScore) {
      query = query.gte('deterministic_score', parseInt(minScore));
    }

    if (maxScore) {
      query = query.lte('deterministic_score', parseInt(maxScore));
    }

    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`);
    }

    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);
    }

    if (niches && niches.length > 0) {
      query = query.in('niche_category', niches);
    }

    if (hookTypes && hookTypes.length > 0) {
      query = query.in('hook_category', hookTypes);
    }

    if (contentTypes && contentTypes.length > 0) {
      query = query.in('content_type', contentTypes);
    }

    if (formats && formats.length > 0) {
      query = query.in('video_format', formats);
    }

    // Apply sorting
    const validSortColumns = [...SELECTABLE_COLUMNS, 'youtube_video_id'] as readonly string[];
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Library] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
    }

    // Map analyzed items
    let allItems = (data || []).map((item: any) => ({
      ...item,
      is_own_video: !!item.youtube_video_id,
      analysis_status: 'analyzed' as const,
    }));

    let totalCount = count || 0;

    // For 'own' or 'all' source, also fetch unanalyzed own videos and merge
    if (source === 'own' || source === 'all') {
      const serviceClient = createServiceClient();
      const remainingSlots = limit - allItems.length;

      if (remainingSlots > 0 && page === 1) {
        let ownUnanalyzedQuery = serviceClient
          .from('channel_videos')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_short', true)
          .is('analysis_job_id', null)
          .order('published_at', { ascending: false })
          .limit(remainingSlots);

        if (search) {
          ownUnanalyzedQuery = ownUnanalyzedQuery.ilike('title', `%${search}%`);
        }

        const { data: unanalyzedOwn } = await ownUnanalyzedQuery;

        if (unanalyzedOwn && unanalyzedOwn.length > 0) {
          const mappedOwn = unanalyzedOwn.map((v: any) => ({
            id: v.id,
            title: v.title,
            video_url: `https://youtube.com/shorts/${v.youtube_video_id}`,
            video_duration: v.duration_seconds,
            created_at: v.published_at,
            starred: false,
            is_own_video: true,
            youtube_video_id: v.youtube_video_id,
            youtube_view_count: v.view_count,
            youtube_like_count: v.like_count,
            analysis_status: 'unanalyzed' as const,
            thumbnail_url: v.thumbnail_url,
            privacy_status: v.privacy_status || 'public',
          }));

          allItems = [...allItems, ...mappedOwn];
        }

        // Get count of unanalyzed own videos for total
        const { count: unanalyzedCount } = await serviceClient
          .from('channel_videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_short', true)
          .is('analysis_job_id', null);

        totalCount += (unanalyzedCount || 0);
      }
    }

    return NextResponse.json({
      items: allItems,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('[Library] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET filter options (distinct values for each filter field)
 */
export async function OPTIONS(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    // Fetch distinct values for filters
    const { data } = await supabase
      .from('analysis_jobs')
      .select('niche_category, hook_category, content_type, video_format')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const niches = [...new Set((data || []).map(d => d.niche_category).filter(Boolean))];
    const hookTypes = [...new Set((data || []).map(d => d.hook_category).filter(Boolean))];
    const contentTypes = [...new Set((data || []).map(d => d.content_type).filter(Boolean))];
    const formats = [...new Set((data || []).map(d => d.video_format).filter(Boolean))];

    return NextResponse.json({
      niches,
      hookTypes,
      contentTypes,
      formats,
    });
  } catch (error) {
    console.error('[Library] Filter options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
