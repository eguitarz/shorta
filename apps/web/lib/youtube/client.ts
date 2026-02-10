/**
 * Authenticated YouTube API client with automatic token refresh.
 *
 * Uses the user's OAuth tokens stored in youtube_connections to make
 * authenticated API calls. Automatically refreshes expired access tokens.
 */

import { createServiceClient } from '@/lib/supabase-service';
import { encryptToken, decryptToken, getEncryptionKey } from './encryption';
import type {
  YouTubeConnection,
  YouTubeChannelInfo,
  YouTubeVideoItem,
  GoogleTokenResponse,
  ParsedDuration,
  RetentionCurvePoint,
} from './types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_ANALYTICS_API_BASE = 'https://youtubeanalytics.googleapis.com/v2';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Token refresh buffer: refresh if expiring within 5 minutes */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds.
 */
export function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get a valid access token for the user, refreshing if needed.
 * Returns null if connection doesn't exist or is disconnected.
 */
export async function getAccessToken(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const encryptionKey = getEncryptionKey();

  // Fetch connection
  const { data: connection, error } = await supabase
    .from('youtube_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !connection) return null;

  const conn = connection as YouTubeConnection;

  // Check if token is still valid
  const expiresAt = new Date(conn.token_expires_at).getTime();
  const now = Date.now();

  if (now < expiresAt - TOKEN_REFRESH_BUFFER_MS) {
    // Token still valid
    return decryptToken(conn.access_token_encrypted, encryptionKey);
  }

  // Token expired or expiring soon -- refresh it
  const refreshToken = await decryptToken(conn.refresh_token_encrypted, encryptionKey);
  const newTokens = await refreshAccessToken(refreshToken);

  if (!newTokens) {
    // Refresh failed -- mark as needs_reauth
    await supabase
      .from('youtube_connections')
      .update({ status: 'needs_reauth', updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    return null;
  }

  // Store new encrypted tokens
  const newAccessEncrypted = await encryptToken(newTokens.access_token, encryptionKey);
  const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

  const updateData: Record<string, string> = {
    access_token_encrypted: newAccessEncrypted,
    token_expires_at: newExpiry,
    updated_at: new Date().toISOString(),
  };

  // If Google returned a new refresh token, update it too
  if (newTokens.refresh_token) {
    updateData.refresh_token_encrypted = await encryptToken(newTokens.refresh_token, encryptionKey);
  }

  await supabase
    .from('youtube_connections')
    .update(updateData)
    .eq('user_id', userId);

  return newTokens.access_token;
}

/**
 * Refresh an access token using the refresh token.
 */
async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse | null> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth client credentials');
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status, await response.text());
      return null;
    }

    return await response.json() as GoogleTokenResponse;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Make an authenticated YouTube API request.
 */
async function youtubeApiFetch(
  accessToken: string,
  endpoint: string,
  params: Record<string, string>
): Promise<any> {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${text}`);
  }

  return response.json();
}

/**
 * Fetch the authenticated user's channel info.
 */
export async function fetchChannelInfo(accessToken: string): Promise<YouTubeChannelInfo> {
  const data = await youtubeApiFetch(accessToken, 'channels', {
    part: 'snippet,statistics',
    mine: 'true',
  });

  const channel = data.items?.[0];
  if (!channel) {
    throw new Error('No YouTube channel found for this account');
  }

  return {
    channelId: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url || '',
    subscriberCount: parseInt(channel.statistics.subscriberCount || '0', 10),
    videoCount: parseInt(channel.statistics.videoCount || '0', 10),
  };
}

/**
 * Fetch all videos from the user's channel.
 * Returns videos with full metadata including duration and stats.
 */
export async function fetchChannelVideos(
  accessToken: string,
  maxPages: number = 4
): Promise<YouTubeVideoItem[]> {
  const allVideos: YouTubeVideoItem[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    // Search for user's videos
    const searchParams: Record<string, string> = {
      part: 'snippet',
      forMine: 'true',
      type: 'video',
      maxResults: '50',
      order: 'date',
    };
    if (pageToken) {
      searchParams.pageToken = pageToken;
    }

    const searchData = await youtubeApiFetch(accessToken, 'search', searchParams);
    const items = searchData.items || [];
    if (items.length === 0) break;

    // Get video IDs for detail fetch
    const videoIds = items
      .map((item: any) => item.id?.videoId)
      .filter(Boolean)
      .join(',');

    if (!videoIds) break;

    // Fetch video details (duration, stats, privacy status)
    const detailData = await youtubeApiFetch(accessToken, 'videos', {
      part: 'contentDetails,statistics,status',
      id: videoIds,
    });

    // Build detail map
    const detailMap = new Map<string, any>();
    for (const detail of detailData.items || []) {
      detailMap.set(detail.id, detail);
    }
    // Debug: log first video's raw status to verify API returns privacyStatus
    const firstDetail = detailData.items?.[0];
    if (firstDetail) {
      console.log(`[YouTube] Raw status field for ${firstDetail.id}:`, JSON.stringify(firstDetail.status));
    }

    // Merge search results with details
    for (const item of items) {
      const videoId = item.id?.videoId;
      if (!videoId) continue;

      const detail = detailMap.get(videoId);
      const durationSeconds = detail
        ? parseISO8601Duration(detail.contentDetails?.duration || 'PT0S')
        : 0;

      const privacyStatus = detail?.status?.privacyStatus || 'public';
      console.log(`[YouTube] Video ${videoId}: "${item.snippet?.title}" - privacy: ${privacyStatus}`);

      allVideos.push({
        videoId,
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        publishedAt: item.snippet?.publishedAt || '',
        durationSeconds,
        isShort: durationSeconds > 0 && durationSeconds <= 180,
        viewCount: parseInt(detail?.statistics?.viewCount || '0', 10),
        likeCount: parseInt(detail?.statistics?.likeCount || '0', 10),
        commentCount: parseInt(detail?.statistics?.commentCount || '0', 10),
        privacyStatus,
      });
    }

    pageToken = searchData.nextPageToken;
    if (!pageToken) break;
  }

  return allVideos;
}

/**
 * Fetch video details by IDs (1 quota unit per video).
 * Much cheaper than fetchChannelVideos which uses search (100 units per page).
 */
export async function fetchVideosByIds(
  accessToken: string,
  videoIds: string[]
): Promise<YouTubeVideoItem[]> {
  if (videoIds.length === 0) return [];

  const data = await youtubeApiFetch(accessToken, 'videos', {
    part: 'snippet,contentDetails,statistics,status',
    id: videoIds.join(','),
  });

  const items = data.items || [];
  return items.map((item: any) => {
    const durationSeconds = parseISO8601Duration(
      item.contentDetails?.duration || 'PT0S'
    );
    return {
      videoId: item.id,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      thumbnailUrl:
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        '',
      publishedAt: item.snippet?.publishedAt || '',
      durationSeconds,
      isShort: durationSeconds > 0 && durationSeconds <= 180,
      viewCount: parseInt(item.statistics?.viewCount || '0', 10),
      likeCount: parseInt(item.statistics?.likeCount || '0', 10),
      commentCount: parseInt(item.statistics?.commentCount || '0', 10),
      privacyStatus: item.status?.privacyStatus || 'public',
    };
  });
}

/**
 * Revoke a Google OAuth token.
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (error) {
    // Best-effort revocation -- don't throw if it fails
    console.error('Token revocation error:', error);
  }
}

/**
 * Fetch retention metrics (avg view duration, avg view percentage) for videos
 * from the YouTube Analytics API.
 * Requires yt-analytics.readonly scope.
 * Batches video IDs in groups of 200.
 * Gracefully returns empty Map on 403 or any error.
 */
export async function fetchVideoRetention(
  accessToken: string,
  videoIds: string[]
): Promise<Map<string, { avgViewDuration: number; avgViewPercentage: number }>> {
  const result = new Map<string, { avgViewDuration: number; avgViewPercentage: number }>();
  if (videoIds.length === 0) return result;

  const BATCH_SIZE = 200;

  try {
    for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
      const batch = videoIds.slice(i, i + BATCH_SIZE);
      const filterValue = batch.join(',');

      const url = new URL(`${YOUTUBE_ANALYTICS_API_BASE}/reports`);
      url.searchParams.set('ids', 'channel==MINE');
      url.searchParams.set('metrics', 'averageViewDuration,averageViewPercentage');
      url.searchParams.set('dimensions', 'video');
      url.searchParams.set('filters', `video==${filterValue}`);
      url.searchParams.set('startDate', '2000-01-01');
      url.searchParams.set('endDate', new Date().toISOString().split('T')[0]);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 403) {
        console.log('[YouTube Analytics] 403 - user lacks yt-analytics.readonly scope');
        return result;
      }

      if (!response.ok) {
        console.error('[YouTube Analytics] Error:', response.status, await response.text());
        return result;
      }

      const data = await response.json();
      const rows = data.rows || [];

      for (const row of rows) {
        // row format: [videoId, averageViewDuration, averageViewPercentage]
        const [videoId, avgViewDuration, avgViewPercentage] = row;
        result.set(videoId, {
          avgViewDuration: Math.round(avgViewDuration),
          avgViewPercentage: Math.round(avgViewPercentage * 100) / 100,
        });
      }
    }
  } catch (error) {
    console.error('[YouTube Analytics] fetchVideoRetention error:', error);
  }

  return result;
}

/**
 * Fetch the per-video retention curve (elapsedVideoTimeRatio) from YouTube Analytics API.
 * Returns ~100 data points showing where viewers drop off.
 * Returns null on any error or 403.
 */
export async function fetchRetentionCurve(
  accessToken: string,
  videoId: string
): Promise<RetentionCurvePoint[] | null> {
  try {
    const url = new URL(`${YOUTUBE_ANALYTICS_API_BASE}/reports`);
    url.searchParams.set('ids', 'channel==MINE');
    url.searchParams.set('metrics', 'audienceWatchRatio,relativeRetentionPerformance');
    url.searchParams.set('dimensions', 'elapsedVideoTimeRatio');
    url.searchParams.set('filters', `video==${videoId}`);
    url.searchParams.set('startDate', '2000-01-01');
    url.searchParams.set('endDate', new Date().toISOString().split('T')[0]);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 403) {
      console.log('[YouTube Analytics] 403 - user lacks yt-analytics.readonly scope for retention curve');
      return null;
    }

    if (!response.ok) {
      console.error('[YouTube Analytics] Retention curve error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const rows = data.rows || [];

    if (rows.length === 0) return null;

    return rows.map((row: any) => ({
      ratio: row[0],
      watchRatio: row[1],
      relativePerformance: row[2],
    }));
  } catch (error) {
    console.error('[YouTube Analytics] fetchRetentionCurve error:', error);
    return null;
  }
}

/**
 * Extract YouTube video ID from a URL.
 * Supports: youtube.com/shorts/ID, youtube.com/watch?v=ID, youtu.be/ID
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = urlObj.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) return shortsMatch[1];

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1) || null;
    }

    return null;
  } catch {
    return null;
  }
}
