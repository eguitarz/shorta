import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/library/[id]/star
 * Toggle star status for an analysis job
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { starred } = body;

    if (typeof starred !== 'boolean') {
      return NextResponse.json({ error: 'Invalid starred value' }, { status: 400 });
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

    // Update starred status (RLS ensures user can only update their own jobs)
    const { data, error } = await supabase
      .from('analysis_jobs')
      .update({ starred })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, starred')
      .single();

    if (error) {
      console.error('[Library] Star update error:', error);
      return NextResponse.json({ error: 'Failed to update star status' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Library] Star API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
