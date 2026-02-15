import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAuthWithCsrf } from '@/lib/auth-helpers';
import { isPaidTier } from '@/lib/tier-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/watch-list/[channelId]
 * Remove a channel from the user's watch list
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const authError = await requireAuthWithCsrf(request);
  if (authError) return authError;

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { channelId } = await params;

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
            // ignore
          }
        },
      },
    }
  );

  // Check paid tier
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier')
    .eq('user_id', user.id)
    .single();

  if (!profile || !isPaidTier(profile.tier)) {
    return NextResponse.json({ error: 'Watch list is available for paid users only' }, { status: 403 });
  }

  const { error } = await supabase
    .from('watch_list_channels')
    .delete()
    .eq('user_id', user.id)
    .eq('channel_id', channelId);

  if (error) {
    console.error('[WatchList] Error deleting:', error);
    return NextResponse.json({ error: 'Failed to remove channel' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
