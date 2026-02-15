import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAuthWithCsrf } from '@/lib/auth-helpers';
import { isPaidTier } from '@/lib/tier-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const MAX_CHANNELS = 10;

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
            // API route - ignore
          }
        },
      },
    }
  );
}

/**
 * GET /api/watch-list
 * Returns the user's watch list channels (paid users only)
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getSupabase();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier')
    .eq('user_id', user.id)
    .single();

  const tier = profile?.tier || 'free';

  if (!isPaidTier(tier)) {
    return NextResponse.json({ channels: [], isPaid: false });
  }

  const { data: channels, error } = await supabase
    .from('watch_list_channels')
    .select('id, channel_id, channel_title, channel_thumbnail, position, created_at')
    .eq('user_id', user.id)
    .order('position', { ascending: true });

  if (error) {
    console.error('[WatchList] Error fetching:', error);
    return NextResponse.json({ error: 'Failed to fetch watch list' }, { status: 500 });
  }

  return NextResponse.json({ channels: channels || [], isPaid: true });
}

/**
 * POST /api/watch-list
 * Add a channel to the user's watch list
 * Body: { channelId: string } — YouTube channel ID
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuthWithCsrf(request);
  if (authError) return authError;

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getSupabase();

  // Check paid tier
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier')
    .eq('user_id', user.id)
    .single();

  if (!profile || !isPaidTier(profile.tier)) {
    return NextResponse.json({ error: 'Watch list is available for paid users only' }, { status: 403 });
  }

  const body = await request.json();
  const channelId = body.channelId?.trim();

  if (!channelId) {
    return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
  }

  // Check max channels
  const { count } = await supabase
    .from('watch_list_channels')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((count ?? 0) >= MAX_CHANNELS) {
    return NextResponse.json(
      { error: `Watch list is limited to ${MAX_CHANNELS} channels` },
      { status: 400 }
    );
  }

  // Resolve channel info from YouTube API
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  const ytUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  ytUrl.searchParams.set('part', 'snippet');
  ytUrl.searchParams.set('id', channelId);
  ytUrl.searchParams.set('key', youtubeApiKey);

  const ytRes = await fetch(ytUrl.toString());
  if (!ytRes.ok) {
    return NextResponse.json({ error: 'Failed to look up YouTube channel' }, { status: 502 });
  }

  const ytData = await ytRes.json();
  const ytChannel = ytData.items?.[0];
  if (!ytChannel) {
    return NextResponse.json({ error: 'YouTube channel not found' }, { status: 404 });
  }

  const channelTitle = ytChannel.snippet?.title || 'Unknown';
  const channelThumbnail =
    ytChannel.snippet?.thumbnails?.medium?.url ||
    ytChannel.snippet?.thumbnails?.default?.url ||
    null;

  // Insert (upsert to handle duplicate gracefully)
  const { data, error } = await supabase
    .from('watch_list_channels')
    .upsert(
      {
        user_id: user.id,
        channel_id: channelId,
        channel_title: channelTitle,
        channel_thumbnail: channelThumbnail,
        position: (count ?? 0),
      },
      { onConflict: 'user_id,channel_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[WatchList] Error inserting:', error);
    return NextResponse.json({ error: 'Failed to add channel' }, { status: 500 });
  }

  return NextResponse.json({ channel: data });
}
