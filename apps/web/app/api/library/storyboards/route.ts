import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/library/storyboards
 * Fetch generated storyboards for the authenticated user with pagination and sorting
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Search
    const search = searchParams.get('search') || '';

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

    // Build query
    let query = supabase
      .from('generated_storyboards')
      .select('id, title, niche_category, content_type, hook_pattern, video_length_seconds, changes_count, analysis_job_id, created_at, updated_at', { count: 'exact' })
      .eq('user_id', user.id);

    // Search filter
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Sorting - only allow safe column names
    const allowedSortColumns = ['created_at', 'updated_at', 'title', 'niche_category', 'content_type'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(safeSortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Library Storyboards] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch storyboards' }, { status: 500 });
    }

    return NextResponse.json({
      items: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      page,
    });
  } catch (error) {
    console.error('[Library Storyboards] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
