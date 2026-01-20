import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface FilterCount {
  value: string;
  count: number;
}

/**
 * GET /api/library/filters
 * Get distinct values with counts for filter dropdowns
 */
export async function GET(request: NextRequest) {
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

    // Fetch all filter columns in one query
    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('niche_category, hook_category, content_type, video_format')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (error) {
      console.error('[Library] Filters error:', error);
      return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
    }

    // Count occurrences for each filter value
    const nicheCounts: Record<string, number> = {};
    const hookTypeCounts: Record<string, number> = {};
    const contentTypeCounts: Record<string, number> = {};
    const formatCounts: Record<string, number> = {};

    // Helper to check if value is valid (non-null, non-empty, non-whitespace)
    const isValidValue = (val: string | null): val is string => {
      return val !== null && val !== undefined && val.trim() !== '';
    };

    (data || []).forEach(row => {
      if (isValidValue(row.niche_category)) {
        const val = row.niche_category.trim();
        nicheCounts[val] = (nicheCounts[val] || 0) + 1;
      }
      if (isValidValue(row.hook_category)) {
        const val = row.hook_category.trim();
        hookTypeCounts[val] = (hookTypeCounts[val] || 0) + 1;
      }
      if (isValidValue(row.content_type)) {
        const val = row.content_type.trim();
        contentTypeCounts[val] = (contentTypeCounts[val] || 0) + 1;
      }
      if (isValidValue(row.video_format)) {
        const val = row.video_format.trim();
        formatCounts[val] = (formatCounts[val] || 0) + 1;
      }
    });

    // Convert to sorted arrays with counts
    const toFilterArray = (counts: Record<string, number>): FilterCount[] =>
      Object.entries(counts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count); // Sort by count descending

    // Count starred
    const { count: starredCount } = await supabase
      .from('analysis_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('starred', true);

    return NextResponse.json({
      niches: toFilterArray(nicheCounts),
      hookTypes: toFilterArray(hookTypeCounts),
      contentTypes: toFilterArray(contentTypeCounts),
      formats: toFilterArray(formatCounts),
      counts: {
        total: data?.length || 0,
        starred: starredCount || 0,
      },
    });
  } catch (error) {
    console.error('[Library] Filters API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
