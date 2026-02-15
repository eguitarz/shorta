import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { isPaidTier } from '@/lib/tier-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/watch-list/search?q=term
 * Search YouTube channels by name (paid users only)
 */
export async function GET(request: NextRequest) {
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
            // ignore
          }
        },
      },
    }
  );

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier')
    .eq('user_id', user.id)
    .single();

  if (!profile || !isPaidTier(profile.tier)) {
    return NextResponse.json({ error: 'Watch list is available for paid users only' }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'channel');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '5');
  url.searchParams.set('key', youtubeApiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error('[WatchList Search] YouTube error:', res.status);
    return NextResponse.json({ error: 'YouTube search failed' }, { status: 502 });
  }

  const data = await res.json();
  const results = (data.items || []).map((item: any) => ({
    channelId: item.snippet?.channelId || item.id?.channelId,
    title: item.snippet?.title || 'Unknown',
    thumbnail:
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      null,
    description: item.snippet?.description || '',
  }));

  return NextResponse.json({ results });
}
