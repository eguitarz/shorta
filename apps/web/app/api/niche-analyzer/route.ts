import { NextRequest, NextResponse } from 'next/server';
import { checkAnonymousTrial, recordAnonymousUsage } from '@/lib/anonymous-usage';
import { getCachedJson, setCachedJson } from '@/lib/kv-cache';

export const dynamic = 'force-dynamic';

type YouTubeVideo = {
  id: string;
  publishedAt: string;
  views: number;
  likes: number;
  duration: string;
};

type VideoSearchResult = {
  videos: YouTubeVideo[];
  totalResults: number;
};

type NicheAnalysisResult = {
  topic: string;
  updatedAt: string;
  sampleSize: number;
  score: number;
  verdict: {
    label: string;
    description: string;
  };
  metrics: {
    demandGrowth: number;
    uploadsPerWeek: number;
    breakoutVelocity: number;
    audienceValue: 'Low' | 'Medium' | 'High';
    productionFit: 'Favorable' | 'Moderate' | 'Challenging';
    stickiness: number;
  };
  risks: string[];
  actions: string[];
};

const CACHE_TTL_SECONDS = 24 * 60 * 60;

const RISK_RULES = [
  {
    match: (metrics: NicheAnalysisResult['metrics']) => metrics.uploadsPerWeek >= 60,
    text: 'High upload velocity required to stay visible.',
  },
  {
    match: (metrics: NicheAnalysisResult['metrics']) => metrics.demandGrowth < 5,
    text: 'Demand growth is flat, so early traction may be slower.',
  },
  {
    match: (metrics: NicheAnalysisResult['metrics']) => metrics.breakoutVelocity >= 4,
    text: 'Outliers dominate views, which can hide smaller creators.',
  },
  {
    match: (metrics: NicheAnalysisResult['metrics']) => metrics.audienceValue === 'Low',
    text: 'Advertiser demand appears lower than average.',
  },
  {
    match: (metrics: NicheAnalysisResult['metrics']) => metrics.productionFit === 'Challenging',
    text: 'Production time may be high to match current leaders.',
  },
];

const ACTIONS = [
  'Ship 3 test videos in 14 days.',
  'Model the top 2 winning formats in this niche.',
  'Pick a specific sub-angle and commit to it for 6 weeks.',
  'Lead with the outcome in the first 3 seconds.',
  'Create a repeatable series format before scaling volume.',
  'Optimize titles and thumbnails for one clear promise.',
];

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
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (topic.length > 120) {
      return NextResponse.json(
        { error: 'Topic is too long' },
        { status: 400 }
      );
    }

    const cacheKey = `niche:${slugify(topic)}`;
    const cached = await getCachedJson<NicheAnalysisResult>(cacheKey);
    if (cached) {
      await recordAnonymousUsage(usage.ipHash, usage.analysesUsed + 1);
      return NextResponse.json(cached);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const recent = await searchYouTubeVideos(topic, apiKey, {
      publishedAfter: thirtyDaysAgo.toISOString(),
      order: 'viewCount',
    });

    const previous = await searchYouTubeVideos(topic, apiKey, {
      publishedAfter: sixtyDaysAgo.toISOString(),
      publishedBefore: thirtyDaysAgo.toISOString(),
      order: 'viewCount',
    });

    if (recent.videos.length === 0) {
      return NextResponse.json(
        { error: 'No recent videos found for this niche.' },
        { status: 404 }
      );
    }

    const recentStats = computeStats(recent.videos);
    const previousStats = computeStats(previous.videos);

    const demandGrowth = computeGrowth(recentStats.avgViews, previousStats.avgViews);
    const uploadsPerWeek = Math.max(1, Math.round(recent.totalResults / 4.3));
    const breakoutVelocity = computeBreakoutVelocity(recentStats.views);
    const stickiness = computeStickiness(recentStats.likesPer1k);
    const audienceValue = computeAudienceValue(recentStats.avgDurationSeconds, recentStats.likesPer1k);
    const productionFit = computeProductionFit(recentStats.avgDurationSeconds);

    const metrics: NicheAnalysisResult['metrics'] = {
      demandGrowth,
      uploadsPerWeek,
      breakoutVelocity,
      audienceValue,
      productionFit,
      stickiness,
    };

    const score = computeConfidenceScore(metrics);
    const verdict = getVerdict(score);
    const risks = buildRisks(metrics);
    const actions = ACTIONS.slice(0, 4);

    const result: NicheAnalysisResult = {
      topic,
      updatedAt: now.toISOString(),
      sampleSize: recent.videos.length,
      score,
      verdict,
      metrics,
      risks,
      actions,
    };

    await setCachedJson(cacheKey, result, CACHE_TTL_SECONDS);
    await recordAnonymousUsage(usage.ipHash, usage.analysesUsed + 1);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Niche Analyzer] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

function getVerdict(score: number) {
  if (score >= 75) {
    return {
      label: 'High Potential',
      description: 'Momentum is strong with clear room for new entrants.',
    };
  }
  if (score >= 60) {
    return {
      label: 'Promising',
      description: 'Good signals, but expect competition and refine your angle.',
    };
  }
  if (score >= 45) {
    return {
      label: 'Needs Validation',
      description: 'Mixed signals. Test narrowly before committing.',
    };
  }
  return {
    label: 'High Risk',
    description: 'Low momentum and heavy competition right now.',
  };
}

async function searchYouTubeVideos(
  topic: string,
  apiKey: string,
  options: {
    publishedAfter: string;
    publishedBefore?: string;
    order?: 'relevance' | 'viewCount' | 'date';
  }
): Promise<VideoSearchResult> {
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('q', topic);
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('order', options.order || 'viewCount');
  searchUrl.searchParams.set('maxResults', '25');
  searchUrl.searchParams.set('publishedAfter', options.publishedAfter);
  if (options.publishedBefore) {
    searchUrl.searchParams.set('publishedBefore', options.publishedBefore);
  }
  searchUrl.searchParams.set('key', apiKey);

  const searchResponse = await fetch(searchUrl.toString());
  if (!searchResponse.ok) {
    throw new Error(`YouTube search failed with status ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const items = searchData.items || [];
  if (items.length === 0) {
    return { videos: [], totalResults: 0 };
  }

  const videoIds = items.map((item: any) => item.id.videoId).join(',');
  const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  statsUrl.searchParams.set('part', 'statistics,contentDetails');
  statsUrl.searchParams.set('id', videoIds);
  statsUrl.searchParams.set('key', apiKey);

  const statsResponse = await fetch(statsUrl.toString());
  if (!statsResponse.ok) {
    throw new Error(`YouTube stats failed with status ${statsResponse.status}`);
  }

  const statsData = await statsResponse.json();

  const videos: YouTubeVideo[] = items.map((item: any, index: number) => {
    const stats = statsData.items?.[index]?.statistics || {};
    const details = statsData.items?.[index]?.contentDetails || {};
    return {
      id: item.id.videoId,
      publishedAt: item.snippet.publishedAt,
      views: parseInt(stats.viewCount || '0', 10),
      likes: parseInt(stats.likeCount || '0', 10),
      duration: details.duration || 'PT0S',
    };
  });

  return {
    videos,
    totalResults: Math.max(items.length, searchData.pageInfo?.totalResults || items.length),
  };
}

function computeStats(videos: YouTubeVideo[]) {
  if (videos.length === 0) {
    return {
      avgViews: 0,
      avgDurationSeconds: 0,
      likesPer1k: 0,
      views: [] as number[],
    };
  }

  const views = videos.map((v) => v.views);
  const durations = videos.map((v) => parseDurationSeconds(v.duration));
  const likes = videos.map((v) => v.likes);

  const avgViews = average(views);
  const avgDurationSeconds = average(durations);
  const likesPer1k = views.length
    ? average(likes.map((like, idx) => (views[idx] ? (like / views[idx]) * 1000 : 0)))
    : 0;

  return {
    avgViews,
    avgDurationSeconds,
    likesPer1k,
    views,
  };
}

function computeGrowth(recent: number, previous: number) {
  if (previous <= 0 && recent > 0) return 100;
  if (previous <= 0 && recent <= 0) return 0;
  return Math.round(((recent - previous) / previous) * 100);
}

function computeBreakoutVelocity(views: number[]) {
  if (views.length === 0) return 1;
  const sorted = [...views].sort((a, b) => b - a);
  const top = sorted.slice(0, 3);
  const topAvg = average(top);
  const median = sorted.length % 2 === 0
    ? average([sorted[sorted.length / 2 - 1], sorted[sorted.length / 2]])
    : sorted[Math.floor(sorted.length / 2)];
  if (median <= 0) return 1;
  return Math.round((topAvg / median) * 10) / 10;
}

function computeStickiness(likesPer1k: number) {
  const baseline = 12;
  const ratio = likesPer1k / baseline;
  return Math.round(clamp(ratio, 0.6, 3.5) * 10) / 10;
}

function computeAudienceValue(avgDurationSeconds: number, likesPer1k: number) {
  const durationScore = clamp(avgDurationSeconds / 600, 0, 1);
  const engagementScore = clamp(likesPer1k / 25, 0, 1);
  const blended = (durationScore + engagementScore) / 2;
  if (blended >= 0.66) return 'High';
  if (blended >= 0.33) return 'Medium';
  return 'Low';
}

function computeProductionFit(avgDurationSeconds: number) {
  if (avgDurationSeconds <= 90) return 'Favorable';
  if (avgDurationSeconds <= 480) return 'Moderate';
  return 'Challenging';
}

function computeConfidenceScore(metrics: NicheAnalysisResult['metrics']) {
  const demandScore = clamp((metrics.demandGrowth + 30) / 100, 0, 1);
  const supplyScore = clamp(1 - metrics.uploadsPerWeek / 80, 0, 1);
  const breakoutScore = clamp((metrics.breakoutVelocity - 1) / 4, 0, 1);
  const audienceScore = metrics.audienceValue === 'High' ? 1 : metrics.audienceValue === 'Medium' ? 0.6 : 0.3;
  const productionScore = metrics.productionFit === 'Favorable' ? 1 : metrics.productionFit === 'Moderate' ? 0.6 : 0.3;
  const stickinessScore = clamp(metrics.stickiness / 3, 0, 1);

  const weighted =
    demandScore * 0.25 +
    supplyScore * 0.2 +
    breakoutScore * 0.2 +
    audienceScore * 0.15 +
    productionScore * 0.1 +
    stickinessScore * 0.1;

  return Math.round(weighted * 100);
}

function buildRisks(metrics: NicheAnalysisResult['metrics']) {
  const matched = RISK_RULES.filter((rule) => rule.match(metrics)).map((rule) => rule.text);
  if (matched.length >= 2) return matched.slice(0, 3);
  const fallback = [
    'Search intent is broad and needs a tighter angle.',
    'Existing creators have strong brand moats.',
  ];
  return [...matched, ...fallback].slice(0, 3);
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
