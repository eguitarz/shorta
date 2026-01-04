import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { requireAuthWithCsrf } from '@/lib/auth-helpers';
import { ApiSchemas, validateRequestBody } from '@/lib/validation';
import { safeParseJSON, createErrorResponse, ErrorCode } from '@/lib/error-handler';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  views: number;
  likes: number;
  duration: string;
}

interface ViralPatterns {
  hookPatterns: string[];
  structurePatterns: string[];
  commonElements: string[];
  averageViews: number;
  videosAnalyzed: number;
  timestamp: string;
}

interface CachedPattern extends ViralPatterns {
  niche: string;
  cacheDate: string;
}

export async function POST(request: NextRequest) {
  // Require authentication and CSRF protection
  const authError = await requireAuthWithCsrf(request);
  if (authError) {
    return authError;
  }

  // Parse and validate request size
  const parseResult = await safeParseJSON(request);
  if (!parseResult.success) {
    return parseResult.error;
  }

  // Validate request schema
  const validation = validateRequestBody(ApiSchemas.analyzeViralPatterns, parseResult.data);
  if (!validation.success) {
    return validation.error;
  }

  const { niche } = validation.data;

  try {

    console.log('Analyzing viral patterns for niche:', niche);

    // Check KV cache first
    const cacheKey = getCacheKey(niche);
    const env = getEnv();

    // Note: KV access is through process.env in Workers
    // We'll implement cache check if VIRAL_PATTERNS binding is available
    let cachedPatterns: CachedPattern | null = null;

    try {
      // In Cloudflare Workers, KV is accessed via env.VIRAL_PATTERNS
      // For now, we'll skip cache and always analyze fresh
      // TODO: Implement proper KV access when deployed
      console.log('Cache key:', cacheKey);
    } catch (e) {
      console.log('Cache check skipped:', e);
    }

    if (cachedPatterns) {
      console.log('Cache hit - returning cached patterns');
      return NextResponse.json({
        patterns: cachedPatterns,
        source: 'cache',
        analyzedAt: (cachedPatterns as CachedPattern).timestamp
      });
    }

    // Cache miss - analyze now
    console.log('Cache miss - analyzing viral videos');

    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    // 1. Search YouTube for viral videos
    let videos = await searchYouTubeVideos(niche, process.env.YOUTUBE_API_KEY);

    // 2. If no videos found, retry with broader scope
    if (videos.length === 0) {
      console.log('No videos found, retrying with broader scope...');

      // Extract main keywords and retry with simpler search
      const broaderNiche = niche
        .replace(/\d+/g, '') // Remove numbers
        .replace(/for \d+/gi, '') // Remove "for 2026" etc
        .split(' ')
        .filter(word => word.length > 3) // Keep only meaningful words
        .slice(0, 3) // Take first 3 words
        .join(' ')
        .trim();

      console.log(`Retrying with broader niche: "${broaderNiche}"`);
      videos = await searchYouTubeVideos(broaderNiche, process.env.YOUTUBE_API_KEY);

      if (videos.length === 0) {
        return NextResponse.json(
          { error: 'No videos found for this niche, even with broader search' },
          { status: 404 }
        );
      }
    }

    console.log(`Found ${videos.length} videos`);

    // 2. Analyze metadata patterns with LLM
    const llmEnv: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };
    const client = createDefaultLLMClient(llmEnv);
    const patterns = await analyzeVideoMetadata(videos, client);

    const result: ViralPatterns = {
      ...patterns,
      averageViews: Math.round(videos.reduce((sum, v) => sum + v.views, 0) / videos.length),
      videosAnalyzed: videos.length,
      timestamp: new Date().toISOString()
    };

    // 3. Cache the results (48 hours)
    try {
      // TODO: Implement KV caching when deployed
      console.log('Would cache patterns for 48 hours');
    } catch (e) {
      console.log('Cache write skipped:', e);
    }

    return NextResponse.json({
      patterns: result,
      source: 'fresh',
      analyzedAt: result.timestamp
    });

  } catch (error) {
    return createErrorResponse(error, ErrorCode.EXTERNAL_API_ERROR, 'Viral pattern analysis');
  }
}

function getCacheKey(niche: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const slug = niche.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 50);
  return `viral_${slug}_${date}`;
}

function getEnv(): any {
  // In Cloudflare Workers, env is passed differently
  // For now, return process.env
  return process.env;
}

async function searchYouTubeVideos(
  niche: string,
  apiKey: string
): Promise<YouTubeVideo[]> {
  // Calculate date for "last 30 days"
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const publishedAfter = thirtyDaysAgo.toISOString();

  // Search for videos
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('q', niche);
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('videoDuration', 'short'); // YouTube Shorts
  searchUrl.searchParams.set('publishedAfter', publishedAfter);
  searchUrl.searchParams.set('order', 'viewCount');
  searchUrl.searchParams.set('maxResults', '20');
  searchUrl.searchParams.set('key', apiKey);

  // Note: Do not log the full URL as it contains the API key
  console.log('Searching YouTube for niche:', niche);

  const searchResponse = await fetch(searchUrl.toString());

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    // Do not log URL or params that might contain API key
    console.error('YouTube API error:', {
      status: searchResponse.status,
      statusText: searchResponse.statusText,
      message: 'Search request failed'
    });
    // Do not include errorText in error message as it might contain sensitive info
    throw new Error(`YouTube search failed with status ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  // Get video statistics
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  statsUrl.searchParams.set('part', 'statistics,contentDetails');
  statsUrl.searchParams.set('id', videoIds);
  statsUrl.searchParams.set('key', apiKey);

  const statsResponse = await fetch(statsUrl.toString());

  if (!statsResponse.ok) {
    // Do not log URL or error text that might contain API key
    console.error('YouTube stats API error:', {
      status: statsResponse.status,
      statusText: statsResponse.statusText,
      message: 'Stats request failed'
    });
    throw new Error(`YouTube stats failed with status ${statsResponse.status}`);
  }

  const statsData = await statsResponse.json();

  // Combine search results with statistics
  const videos: YouTubeVideo[] = searchData.items.map((item: any, i: number) => {
    const stats = statsData.items[i]?.statistics || {};
    const contentDetails = statsData.items[i]?.contentDetails || {};

    return {
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      views: parseInt(stats.viewCount || '0'),
      likes: parseInt(stats.likeCount || '0'),
      duration: contentDetails.duration || 'PT0S'
    };
  });

  // Sort by views (highest first)
  videos.sort((a, b) => b.views - a.views);

  return videos;
}

async function analyzeVideoMetadata(
  videos: YouTubeVideo[],
  llmClient: any
): Promise<Omit<ViralPatterns, 'averageViews' | 'videosAnalyzed' | 'timestamp'>> {

  const prompt = `Analyze these ${videos.length} viral YouTube Shorts to identify winning patterns.

VIDEOS:
${videos.slice(0, 15).map((v, i) => `
${i + 1}. "${v.title}"
   Views: ${v.views.toLocaleString()}
   Published: ${new Date(v.publishedAt).toLocaleDateString()}
   Description: ${v.description.substring(0, 150)}...
`).join('\n')}

Your task: Identify concrete, actionable patterns that made these videos successful.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "hookPatterns": [
    "Specific pattern 1 (e.g., 'Start with shocking number or stat')",
    "Specific pattern 2",
    "Specific pattern 3"
  ],
  "structurePatterns": [
    "Common structure 1 (e.g., 'Problem → Solution → Result')",
    "Common structure 2"
  ],
  "commonElements": [
    "Element 1 (e.g., 'Uses comparison/before-after')",
    "Element 2",
    "Element 3"
  ]
}

Focus on:
- Hook patterns: How do titles grab attention in first 3 words?
- Structure patterns: What narrative flow do most videos follow?
- Common elements: What specific techniques appear repeatedly?

Be specific and actionable. Avoid vague advice.`;

  console.log('Analyzing metadata with LLM...');

  const response = await llmClient.chat([
    { role: 'user', content: prompt }
  ], {
    model: 'gemini-2.5-flash-lite',
    temperature: 0.3,
    maxTokens: 4096, // Increased to ensure complete response
  });

  console.log('LLM response received');
  console.log('Response length:', response.content.length);
  console.log('Response preview:', response.content.substring(0, 200));

  // Parse JSON from response
  let jsonContent = response.content.trim();

  // Remove markdown code blocks if present
  if (jsonContent.includes('```')) {
    const match = jsonContent.match(/```(?:json)?\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/);
    if (match) {
      jsonContent = match[1];
    } else {
      jsonContent = jsonContent.replace(/```json/g, '').replace(/```/g, '').trim();
    }
  }

  try {
    const parsed = JSON.parse(jsonContent);
    return {
      hookPatterns: parsed.hookPatterns || [],
      structurePatterns: parsed.structurePatterns || [],
      commonElements: parsed.commonElements || []
    };
  } catch (e) {
    console.error('JSON parse error:', e instanceof Error ? e.message : 'Unknown error');
    console.error('JSON content length:', jsonContent.length);
    console.error('JSON content (first 500 chars):', jsonContent.substring(0, 500));
    console.error('JSON content (last 500 chars):', jsonContent.substring(Math.max(0, jsonContent.length - 500)));

    // Try to fix common JSON issues
    try {
      // Remove any trailing commas before closing brackets
      let fixedJson = jsonContent
        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
        .replace(/\n/g, ' ')  // Remove newlines
        .replace(/\r/g, '')   // Remove carriage returns
        .trim();

      const parsed = JSON.parse(fixedJson);
      console.log('Successfully parsed after cleanup');
      return {
        hookPatterns: parsed.hookPatterns || [],
        structurePatterns: parsed.structurePatterns || [],
        commonElements: parsed.commonElements || []
      };
    } catch (retryError) {
      console.error('Retry parse also failed');
      throw new Error('Failed to parse pattern analysis');
    }
  }
}
