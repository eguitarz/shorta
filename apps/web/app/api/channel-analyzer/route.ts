import { NextRequest, NextResponse } from 'next/server';
import { checkAnonymousTrial, recordAnonymousUsage } from '@/lib/anonymous-usage';
import { getCachedJson, setCachedJson } from '@/lib/kv-cache';

export const dynamic = 'force-dynamic';

type ChannelInfo = {
  id: string;
  title: string;
  handle?: string | null;
  url: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  uploadsPlaylistId: string;
};

type VideoInfo = {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  durationSeconds: number;
};

type ChannelAnalysisResult = {
  channel: ChannelInfo;
  metrics: {
    avgViews: number;
    medianViews: number;
    uploadsPerWeek: number;
    viewsPerMonth: number;
    engagementPer1k: number;
    consistencyScore: number;
    avgDurationSeconds: number;
    shortsShare: number;
  };
  videos: VideoInfo[];
  sampleSize: number;
  updatedAt: string;
};

const CACHE_TTL_SECONDS = 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    const usage = await checkAnonymousTrial(request);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: 'Free trial already used for this IP.',
          upgradeRequired: true,
          analyses_used: usage.analysesUsed,
          analyses_limit: 1,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const input = typeof body?.channel === 'string' ? body.channel.trim() : '';
    if (!input) {
      return NextResponse.json(
        { error: 'Channel URL or handle is required' },
        { status: 400 }
      );
    }

    const resolved = await resolveChannelId(input, apiKey);
    if (!resolved) {
      return NextResponse.json(
        { error: 'Unable to resolve channel. Try a full channel URL or @handle.' },
        { status: 404 }
      );
    }

    const cacheKey = `channel:${resolved.channelId}`;
    const cached = await getCachedJson<ChannelAnalysisResult>(cacheKey);
    if (cached) {
      await recordAnonymousUsage(usage.ipHash, usage.analysesUsed + 1);
      return NextResponse.json(cached);
    }

    const channel = await fetchChannelInfo(resolved.channelId, apiKey);
    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found.' },
        { status: 404 }
      );
    }

    const videos = await fetchRecentVideos(channel.uploadsPlaylistId, apiKey);
    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No recent videos found for this channel.' },
        { status: 404 }
      );
    }

    const metrics = computeMetrics(videos);
    const result: ChannelAnalysisResult = {
      channel,
      metrics,
      videos,
      sampleSize: videos.length,
      updatedAt: new Date().toISOString(),
    };

    await setCachedJson(cacheKey, result, CACHE_TTL_SECONDS);
    await recordAnonymousUsage(usage.ipHash, usage.analysesUsed + 1);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Channel Analyzer] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function resolveChannelId(input: string, apiKey: string): Promise<{ channelId: string } | null> {
  const parsed = parseChannelInput(input);

  if (parsed.channelId) {
    return { channelId: parsed.channelId };
  }

  if (parsed.handle) {
    const byHandle = await fetchChannelByHandle(parsed.handle, apiKey);
    if (byHandle) return { channelId: byHandle };
  }

  if (parsed.username) {
    const byUser = await fetchChannelByUsername(parsed.username, apiKey);
    if (byUser) return { channelId: byUser };
  }

  const query = parsed.query;
  if (!query) return null;
  const bySearch = await searchChannel(query, apiKey);
  return bySearch ? { channelId: bySearch } : null;
}

function parseChannelInput(input: string) {
  const trimmed = input.trim();
  const result: {
    channelId?: string;
    handle?: string;
    username?: string;
    query?: string;
  } = {};

  if (trimmed.startsWith('UC') && trimmed.length >= 16) {
    result.channelId = trimmed;
    return result;
  }

  if (trimmed.startsWith('@')) {
    result.handle = trimmed.replace('@', '');
    return result;
  }

  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname;
      const channelMatch = path.match(/\/channel\/(UC[0-9A-Za-z_-]+)/);
      if (channelMatch) {
        result.channelId = channelMatch[1];
        return result;
      }

      const handleMatch = path.match(/\/@([0-9A-Za-z_-]+)/);
      if (handleMatch) {
        result.handle = handleMatch[1];
        return result;
      }

      const userMatch = path.match(/\/user\/([0-9A-Za-z_-]+)/);
      if (userMatch) {
        result.username = userMatch[1];
        return result;
      }

      const customMatch = path.match(/\/c\/([0-9A-Za-z_-]+)/);
      if (customMatch) {
        result.query = customMatch[1];
        return result;
      }
    } catch {
      result.query = trimmed;
      return result;
    }
  }

  result.query = trimmed;
  return result;
}

async function fetchChannelByHandle(handle: string, apiKey: string) {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'id');
  url.searchParams.set('forHandle', handle);
  url.searchParams.set('key', apiKey);
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  return data.items?.[0]?.id ?? null;
}

async function fetchChannelByUsername(username: string, apiKey: string) {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'id');
  url.searchParams.set('forUsername', username);
  url.searchParams.set('key', apiKey);
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  return data.items?.[0]?.id ?? null;
}

async function searchChannel(query: string, apiKey: string) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'channel');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('key', apiKey);
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  return data.items?.[0]?.id?.channelId ?? null;
}

async function fetchChannelInfo(channelId: string, apiKey: string): Promise<ChannelInfo | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'snippet,statistics,contentDetails');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  const item = data.items?.[0];
  if (!item) return null;

  const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return null;

  return {
    id: channelId,
    title: item.snippet?.title || 'Unknown',
    handle: item.snippet?.customUrl || null,
    url: `https://www.youtube.com/channel/${channelId}`,
    subscribers: parseInt(item.statistics?.subscriberCount || '0', 10),
    totalViews: parseInt(item.statistics?.viewCount || '0', 10),
    videoCount: parseInt(item.statistics?.videoCount || '0', 10),
    uploadsPlaylistId,
  };
}

async function fetchRecentVideos(playlistId: string, apiKey: string): Promise<VideoInfo[]> {
  const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  playlistUrl.searchParams.set('part', 'snippet,contentDetails');
  playlistUrl.searchParams.set('playlistId', playlistId);
  playlistUrl.searchParams.set('maxResults', '30');
  playlistUrl.searchParams.set('key', apiKey);

  const playlistResponse = await fetch(playlistUrl.toString());
  if (!playlistResponse.ok) {
    throw new Error(`YouTube playlist lookup failed with status ${playlistResponse.status}`);
  }

  const playlistData = await playlistResponse.json();
  const items = playlistData.items || [];
  if (items.length === 0) return [];

  const videoIds = items.map((item: any) => item.contentDetails.videoId).join(',');
  const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  statsUrl.searchParams.set('part', 'statistics,contentDetails,snippet');
  statsUrl.searchParams.set('id', videoIds);
  statsUrl.searchParams.set('key', apiKey);

  const statsResponse = await fetch(statsUrl.toString());
  if (!statsResponse.ok) {
    throw new Error(`YouTube stats lookup failed with status ${statsResponse.status}`);
  }

  const statsData = await statsResponse.json();
  const statsMap = new Map(
    (statsData.items || []).map((item: any) => [item.id, item])
  );

  return items.map((item: any) => {
    const stats = statsMap.get(item.contentDetails.videoId);
    const duration = stats?.contentDetails?.duration || 'PT0S';
    return {
      id: item.contentDetails.videoId,
      title: item.snippet?.title || 'Untitled',
      publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt,
      views: parseInt(stats?.statistics?.viewCount || '0', 10),
      likes: parseInt(stats?.statistics?.likeCount || '0', 10),
      durationSeconds: parseDurationSeconds(duration),
    };
  });
}

function computeMetrics(videos: VideoInfo[]) {
  const views = videos.map((v) => v.views);
  const durations = videos.map((v) => v.durationSeconds);
  const likes = videos.map((v) => v.likes);

  const avgViews = average(views);
  const medianViews = median(views);
  const avgDurationSeconds = average(durations);
  const engagementPer1k = average(
    likes.map((like, idx) => (views[idx] ? (like / views[idx]) * 1000 : 0))
  );

  const uploadsPerWeek = computeUploadsPerWeek(videos);
  const viewsPerMonth = computeViewsPerMonth(videos);
  const shortsShare = videos.length
    ? Math.round((videos.filter((v) => v.durationSeconds <= 60).length / videos.length) * 100)
    : 0;

  const consistencyScore = computeConsistencyScore(uploadsPerWeek, views);

  return {
    avgViews: Math.round(avgViews),
    medianViews: Math.round(medianViews),
    uploadsPerWeek,
    viewsPerMonth: Math.round(viewsPerMonth),
    engagementPer1k: Math.round(engagementPer1k * 10) / 10,
    consistencyScore,
    avgDurationSeconds: Math.round(avgDurationSeconds),
    shortsShare,
  };
}

function computeUploadsPerWeek(videos: VideoInfo[]) {
  if (videos.length < 2) return 0;
  const sorted = [...videos].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
  const first = new Date(sorted[0].publishedAt).getTime();
  const last = new Date(sorted[sorted.length - 1].publishedAt).getTime();
  const days = Math.max(1, (last - first) / (1000 * 60 * 60 * 24));
  const weeks = days / 7;
  return Math.round((videos.length / weeks) * 10) / 10;
}

function computeViewsPerMonth(videos: VideoInfo[]) {
  const now = Date.now();
  const perDay = videos
    .map((video) => {
      const ageDays = Math.max(1, (now - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
      return video.views / ageDays;
    })
    .filter(Boolean);
  const avgPerDay = average(perDay);
  return avgPerDay * 30;
}

function computeConsistencyScore(uploadsPerWeek: number, views: number[]) {
  const cadenceScore = clamp(uploadsPerWeek / 4, 0, 1);
  const varianceScore = 1 - clamp(standardDeviation(views) / (average(views) || 1) / 1.5, 0, 1);
  return Math.round((cadenceScore * 0.5 + varianceScore * 0.5) * 100);
}

function parseDurationSeconds(duration: string) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function standardDeviation(values: number[]) {
  if (values.length === 0) return 0;
  const avg = average(values);
  const variance = average(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
