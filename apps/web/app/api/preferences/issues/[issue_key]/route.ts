import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAuthWithCsrf } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * DELETE /api/preferences/issues/[issue_key]
 * Reset a preference back to original (delete the preference record)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ issue_key: string }> }
) {
  const authError = await requireAuthWithCsrf(request);
  if (authError) return authError;

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { issue_key } = await params;

    if (!issue_key) {
      return NextResponse.json(
        { error: 'Missing issue_key parameter' },
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

    const decodedKey = decodeURIComponent(issue_key);

    const { error } = await supabase
      .from('user_issue_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('issue_key', decodedKey);

    if (error) {
      console.error('[Preferences] Error deleting:', error);
      return NextResponse.json(
        { error: 'Failed to delete preference' },
        { status: 500 }
      );
    }

    console.log(`[Preferences] User ${user.id} reset preference for ${decodedKey}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Preferences] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
