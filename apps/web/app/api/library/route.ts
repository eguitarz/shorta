import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// All selectable columns for the library table
const SELECTABLE_COLUMNS = [
  // Basic
  'id', 'title', 'video_url', 'video_duration', 'created_at', 'starred',
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
    const niches = searchParams.get('niches')?.split(',').filter(Boolean);
    const hookTypes = searchParams.get('hookTypes')?.split(',').filter(Boolean);
    const contentTypes = searchParams.get('contentTypes')?.split(',').filter(Boolean);
    const formats = searchParams.get('formats')?.split(',').filter(Boolean);

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

    // Build query - select all useful columns
    let query = supabase
      .from('analysis_jobs')
      .select(SELECTABLE_COLUMNS.join(','), { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed'); // Only show completed analyses

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
    const validSortColumns = SELECTABLE_COLUMNS as readonly string[];
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

    return NextResponse.json({
      items: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
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
