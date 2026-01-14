import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAuthWithCsrf } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic';

/**
 * GET /api/preferences/issues
 * Fetch all issue severity preferences for the current user
 * Returns a map of issue_key -> { severity, original_severity }
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    // Return empty object for non-authenticated users
    return NextResponse.json({ preferences: {} });
  }

  try {
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

    const { data, error } = await supabase
      .from('user_issue_preferences')
      .select('issue_key, severity, original_severity')
      .eq('user_id', user.id);

    if (error) {
      console.error('[Preferences] Error fetching:', error);
      return NextResponse.json({ preferences: {} });
    }

    // Convert to map for easy lookup
    const preferences: Record<
      string,
      { severity: string; original_severity: string }
    > = {};
    data?.forEach((pref) => {
      preferences[pref.issue_key] = {
        severity: pref.severity,
        original_severity: pref.original_severity,
      };
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('[Preferences] API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences/issues
 * Save or update an issue severity preference
 * Body: { issue_key: string, severity: string, original_severity: string }
 */
export async function POST(request: NextRequest) {
  // Require authentication with CSRF protection
  const authError = await requireAuthWithCsrf(request);
  if (authError) return authError;

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { issue_key, severity, original_severity } = await request.json();

    // Validate inputs
    if (!issue_key || !severity || !original_severity) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: issue_key, severity, original_severity',
        },
        { status: 400 }
      );
    }

    const validSeverities = ['critical', 'moderate', 'minor', 'ignored'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const validOriginalSeverities = ['critical', 'moderate', 'minor'];
    if (!validOriginalSeverities.includes(original_severity)) {
      return NextResponse.json(
        {
          error: `Invalid original_severity. Must be one of: ${validOriginalSeverities.join(', ')}`,
        },
        { status: 400 }
      );
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
              // API route - ignore cookie setting errors
            }
          },
        },
      }
    );

    // Upsert preference (insert or update on conflict)
    const { data, error } = await supabase
      .from('user_issue_preferences')
      .upsert(
        {
          user_id: user.id,
          issue_key,
          severity,
          original_severity,
        },
        {
          onConflict: 'user_id,issue_key',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Preferences] Error saving:', error);
      return NextResponse.json(
        { error: 'Failed to save preference' },
        { status: 500 }
      );
    }

    console.log(
      `[Preferences] User ${user.id} set ${issue_key}: ${original_severity} -> ${severity}`
    );

    return NextResponse.json({
      success: true,
      preference: data,
    });
  } catch (error) {
    console.error('[Preferences] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
