import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const DEFAULT_REGION = 'US';
const DEFAULT_LIMIT = 12;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RESULTS = 300;
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const CACHE_NAMESPACE = 'VIRAL_PATTERNS';
const CHANNEL_SEED_IDS_US = [
  'UCctXZhXmG-kf3tlIXgVZUlw', // Gary Vaynerchuk
  'UCoOae5nYA7VqaXzerajD0lg', // Ali Abdaal
  'UCUyDOdBWhC1MCxEjC46d-zw', // Alex Hormozi
  'UCWXYDYv5STLk-zoxMP2I1Lw', // Dan Koe
  'UCF2v8v8te3_u4xhIQ8tGy1g', // Noah Kagan
  'UCh_dVD10YuSghle8g6yjePg',
  'UCIHdDJ0tjn_3j-FS7s_X1kQ',
  'UC0vZSXQHRGPNZMFAKPLJcww',
];

const CHANNEL_SEED_IDS_KR = [
  'UCsJ6RuBiTVWRX156FVbeaGg', // 슈카월드
  'UCA_hgsFzmynpv1zkvA5A7jA', // 지식인사이드
  'UCUj6rrhMTR9pipbAWBAMvUQ', // 침착맨
  'UCvW8norVMTLt7QN-s2pS4Bw', // 조승연의 탐구생활
  'UCoCvTlU0KpNYwnMIgs7MPrA', // 보다 BODA
  'UCvil4OAt-zShzkKHsg9EQAw', // 김작가 TV
  'UChlv4GSd7OQl3js-jkLOnFA', // 삼프로TV
  'UCwzLJSRcPOIPXTRt77HI6iA', // 셜록현준
  'UCDSj40X9FFUAnx1nv7gQhcA', // 월급쟁이부자들TV
  'UCkxbPwdaV74Erdxt97Nt23w', // 공부왕찐천재 홍진경
  'UCJo6G1u0e_-wS-JQn3T-zEw', // 머니코믹스
  'UCSsFsvOePFVWgQ8vTf0NjbQ', // 듣똑라
  'UCCgMUqWfLg3plThNaIemW8Q', // 너와 나의 은퇴학교
  'UCJKZoVf3RIMfFffjdseqdEg', // 디에디트
  'UCQ2DWm5Md16Dc3xRwwhVE7Q', // EO Korea
  'UCI3mHMt-wivlZ3LS_1KiPHQ', // 장동선의 궁금한 뇌
  'UC8ObYrye1Z8VKLg0xdXcZg', // 일분미만
  'UCAP8OK0GHFbnL5OkY3j04Xw', // 달변가 영수
  'UCrhsqLBUMK8q72wLK-t9D1w', // 드로우앤드류
  'UCv8uU-R6nLzV6O_D9_r8XvQ', // 단내
];

interface TrendItem {
  videoId: string;
  title: string;
  channelTitle: string;
  categoryId?: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationSeconds: number | null;
  viewsPerHour: number;
  engagementRate: number;
  url: string;
}

interface TrendsResponse {
  items: TrendItem[];
  region: string;
  regionSource: 'geo' | 'client' | 'ip' | 'default' | 'geo-fallback';
  usedFallback: boolean;
  generatedAt: string;
  channelSet?: 'us' | 'kr';
}

const trendsCache = new Map<string, { expiresAt: number; data: TrendsResponse }>();

type KvNamespace = {
  get: (key: string, type?: 'json') => Promise<any>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

function getCloudflareEnv(): Record<string, any> | null {
  const context = (globalThis as any)[Symbol.for('__cloudflare-context__')];
  return context?.env ?? null;
}

function getKvNamespace(): KvNamespace | null {
  const env = getCloudflareEnv();
  const kv = env?.[CACHE_NAMESPACE] ?? (globalThis as any)[CACHE_NAMESPACE] ?? (process.env as any)[CACHE_NAMESPACE];
  if (kv && typeof kv.get === 'function' && typeof kv.put === 'function') {
    return kv as KvNamespace;
  }
  return null;
}


function normalizeRegion(region: string | null | undefined): string | null {
  if (!region) return null;
  const cleaned = region.trim().toUpperCase();
  return cleaned.length === 2 ? cleaned : null;
}

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number.parseInt(match[1] || '0', 10);
  const minutes = Number.parseInt(match[2] || '0', 10);
  const seconds = Number.parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function getPublishedAfter(hoursAgo: number): string {
  const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return date.toISOString();
}

function getViewsPerHour(viewCount: number, publishedAt: string): number {
  const publishedTime = new Date(publishedAt).getTime();
  const hoursSince = Math.max(1, (Date.now() - publishedTime) / 3600000);
  return viewCount / hoursSince;
}

async function fetchChannelUploads(params: {
  apiKey: string;
  channelIds: string[];
}): Promise<Record<string, string>> {
  if (params.channelIds.length === 0) return {};
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('id', params.channelIds.join(','));
  url.searchParams.set('key', params.apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error('YouTube channels error:', response.status, response.statusText);
    return {};
  }

  const data = await response.json();
  const mapping: Record<string, string> = {};
  for (const item of data.items || []) {
    const uploads = item?.contentDetails?.relatedPlaylists?.uploads;
    if (uploads) {
      mapping[item.id] = uploads;
    }
  }

  const returnedIds = new Set(Object.keys(mapping));
  const missingIds = params.channelIds.filter((id) => !returnedIds.has(id));
  if (missingIds.length > 0) {
    console.warn('YouTube channels not found:', missingIds);
  }

  return mapping;
}

async function fetchRecentUploadVideoIds(params: {
  apiKey: string;
  uploadsPlaylistIds: string[];
  publishedAfterMs: number;
}): Promise<string[]> {
  const videoIds: string[] = [];

  for (const playlistId of params.uploadsPlaylistIds) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'contentDetails,snippet');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '10');
    url.searchParams.set('key', params.apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('YouTube playlistItems error:', response.status, response.statusText);
      continue;
    }

    const data = await response.json();
    for (const item of data.items || []) {
      const publishedAt = item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt;
      if (!publishedAt) continue;
      const publishedAtMs = new Date(publishedAt).getTime();
      if (publishedAtMs < params.publishedAfterMs) continue;
      const videoId = item?.contentDetails?.videoId;
      if (videoId && !videoIds.includes(videoId)) {
        videoIds.push(videoId);
      }
    }
  }

  return videoIds;
}

async function fetchVideoDetails(params: { apiKey: string; videoIds: string[] }) {
  const items: any[] = [];
  const chunkSize = 50;
  for (let i = 0; i < params.videoIds.length; i += chunkSize) {
    const chunk = params.videoIds.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics,contentDetails');
    url.searchParams.set('id', chunk.join(','));
    url.searchParams.set('key', params.apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('YouTube videos error:', response.status, response.statusText);
      continue;
    }

    const data = await response.json();
    items.push(...(data.items || []));
  }

  return items;
}

async function buildTrends(params: {
  apiKey: string;
  region: string;
  limit: number;
  channelSet: 'us' | 'kr';
  location?: { lat: number; lng: number } | null;
}) {
  const publishedAfter = getPublishedAfter(168);
  const publishedAfterMs = new Date(publishedAfter).getTime();
  const maxResults = Math.min(MAX_RESULTS, Math.max(200, params.limit * 2, params.limit));

  const channelIds = (params.channelSet === 'kr' ? CHANNEL_SEED_IDS_KR : CHANNEL_SEED_IDS_US)
    .slice(0, maxResults);
  const uploadsMap = await fetchChannelUploads({
    apiKey: params.apiKey,
    channelIds,
  });
  const uploadsPlaylists = Object.values(uploadsMap);
  const recentVideoIds = await fetchRecentUploadVideoIds({
    apiKey: params.apiKey,
    uploadsPlaylistIds: uploadsPlaylists,
    publishedAfterMs,
  });
  const details = await fetchVideoDetails({
    apiKey: params.apiKey,
    videoIds: recentVideoIds,
  });

  const usedFallback = Boolean(params.location);
  const regionSource: TrendsResponse['regionSource'] = params.location ? 'geo-fallback' : 'client';

  const baseItems = details
    .map((item: any) => {
      const stats = item.statistics || {};
      const snippet = item.snippet || {};
      const contentDetails = item.contentDetails || {};
      const publishedAt = snippet.publishedAt || new Date().toISOString();
      const categoryId = snippet.categoryId || '';
      const viewCount = Number.parseInt(stats.viewCount || '0', 10);
      const likeCount = Number.parseInt(stats.likeCount || '0', 10);
      const commentCount = Number.parseInt(stats.commentCount || '0', 10);
      const durationSeconds = contentDetails.duration
        ? parseDurationSeconds(contentDetails.duration)
        : null;
      const viewsPerHour = getViewsPerHour(viewCount, publishedAt);
      const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;

      const trendItem: TrendItem = {
        videoId: item.id,
        title: snippet.title || 'Untitled',
        channelTitle: snippet.channelTitle || 'Unknown',
        categoryId: categoryId || undefined,
        publishedAt,
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          '',
        viewCount,
        likeCount,
        commentCount,
        durationSeconds,
        viewsPerHour,
        engagementRate,
        url: `https://www.youtube.com/shorts/${item.id}`,
      };

      return {
        trendItem,
        categoryId,
      };
    });

  console.log('Fetched videos count:', baseItems.length);

  const filterByCategory = () =>
    baseItems
      .filter((item) => new Date(item.trendItem.publishedAt).getTime() >= publishedAfterMs)
      .filter((item) => item.trendItem.durationSeconds !== null && item.trendItem.durationSeconds <= 180)
      .sort((a, b) => b.trendItem.viewsPerHour - a.trendItem.viewsPerHour)
      .map((item) => item.trendItem);

  const items = filterByCategory().slice(0, params.limit);
  const usedFallbackFilter = false;

  return {
    items,
    regionSource,
    usedFallback: usedFallback || usedFallbackFilter,
  };
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limitParam = Number.parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10);
  const limit = Math.min(
    MAX_RESULTS,
    Number.isFinite(limitParam) ? Math.max(1, limitParam) : DEFAULT_LIMIT
  );
  const channelSet = searchParams.get('channelSet') === 'kr' ? 'kr' : 'us';
  const region = channelSet === 'kr' ? 'KR' : DEFAULT_REGION;
  const regionSource: TrendsResponse['regionSource'] = 'default';

  const cacheKey = `region:${region}:${channelSet}:${limit}:${new Date().toISOString().slice(0, 10)}`;

  const kv = getKvNamespace();
  console.log('Trends cache:', {
    usingKv: Boolean(kv),
    cacheKey,
  });
  if (kv) {
    try {
      const cached = await kv.get(cacheKey, 'json');
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch (error) {
      console.warn('KV cache read failed:', error);
    }
  } else {
    const cached = trendsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }
  }

  try {
    const { items, usedFallback } = await buildTrends({
      apiKey: youtubeApiKey,
      region,
      limit,
      channelSet,
    });

    const response: TrendsResponse = {
      items,
      region,
      regionSource,
      usedFallback,
      generatedAt: new Date().toISOString(),
      channelSet,
    };

    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify(response), { expirationTtl: CACHE_TTL_SECONDS });
      } catch (error) {
        console.warn('KV cache write failed:', error);
      }
    } else {
      trendsCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        data: response,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error building trends:', error);
    return NextResponse.json({ error: 'Failed to fetch local trends' }, { status: 500 });
  }
}
