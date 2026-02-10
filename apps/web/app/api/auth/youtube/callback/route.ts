import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';
import { encryptToken, getEncryptionKey } from '@/lib/youtube/encryption';
import { fetchChannelInfo } from '@/lib/youtube/client';
import { cookies } from 'next/headers';
import type { GoogleTokenResponse } from '@/lib/youtube/types';

export const dynamic = 'force-dynamic';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * GET /api/auth/youtube/callback
 * Handles the OAuth2 callback from Google after user consents.
 * Exchanges auth code for tokens, stores encrypted tokens, fetches channel info.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  // Verify user is authenticated with Supabase
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Check for errors from Google
  const error = requestUrl.searchParams.get('error');
  if (error) {
    console.error('YouTube OAuth error:', error);
    return NextResponse.redirect(`${appUrl}/home?youtube=error&reason=${error}`);
  }

  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/home?youtube=error&reason=missing_params`);
  }

  // Validate state against cookie
  const cookieStore = await cookies();
  const storedState = cookieStore.get('youtube_oauth_state')?.value;

  if (!storedState || storedState !== state) {
    console.error('YouTube OAuth state mismatch');
    return NextResponse.redirect(`${appUrl}/home?youtube=error&reason=state_mismatch`);
  }

  // Clear the state cookie
  cookieStore.delete('youtube_oauth_state');

  try {
    // Exchange authorization code for tokens
    const redirectUri = `${appUrl}/api/auth/youtube/callback`;
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return NextResponse.redirect(`${appUrl}/home?youtube=error&reason=token_exchange`);
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Missing tokens in response');
      return NextResponse.redirect(`${appUrl}/home?youtube=error&reason=no_tokens`);
    }

    // Fetch channel info
    const channelInfo = await fetchChannelInfo(tokens.access_token);

    // Encrypt tokens
    const encryptionKey = getEncryptionKey();
    const accessTokenEncrypted = await encryptToken(tokens.access_token, encryptionKey);
    const refreshTokenEncrypted = await encryptToken(tokens.refresh_token, encryptionKey);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store connection in database (upsert -- update if already exists)
    const supabase = createServiceClient();
    const { error: dbError } = await supabase
      .from('youtube_connections')
      .upsert(
        {
          user_id: user.id,
          channel_id: channelInfo.channelId,
          channel_title: channelInfo.title,
          channel_thumbnail_url: channelInfo.thumbnailUrl,
          subscriber_count: channelInfo.subscriberCount,
          video_count: channelInfo.videoCount,
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          token_expires_at: tokenExpiresAt,
          status: 'active',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (dbError) {
      console.error('Failed to store YouTube connection:', dbError);
      return NextResponse.redirect(`${appUrl}/home?youtube=error&reason=db_error`);
    }

    // Trigger initial video sync in the background (best-effort)
    // We don't await this -- let the user see the connected state immediately
    // The sync will happen when they click "Sync" or on next page load
    try {
      const { fetchChannelVideos: fetchVideos } = await import('@/lib/youtube/client');
      const videos = await fetchVideos(tokens.access_token);

      // Upsert videos
      for (const video of videos) {
        await supabase.from('channel_videos').upsert(
          {
            user_id: user.id,
            youtube_video_id: video.videoId,
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            published_at: video.publishedAt,
            duration_seconds: video.durationSeconds,
            is_short: video.isShort,
            view_count: video.viewCount,
            like_count: video.likeCount,
            comment_count: video.commentCount,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,youtube_video_id' }
        );
      }

      // Update sync timestamp
      await supabase
        .from('youtube_connections')
        .update({ last_video_sync_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (syncError) {
      // Non-fatal -- sync can be retried from the dashboard
      console.error('Initial video sync failed:', syncError);
    }

    // Redirect to home with success indicator
    return NextResponse.redirect(`${appUrl}/home?youtube=connected`);
  } catch (err) {
    console.error('YouTube OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/home?youtube=error&reason=unexpected`);
  }
}
