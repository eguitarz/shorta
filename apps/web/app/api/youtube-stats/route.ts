import { requireAuth } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Parse ISO 8601 duration (PT1M30S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// Fetch YouTube video statistics
async function fetchYouTubeStats(videoId: string, apiKey?: string) {
  if (!apiKey) {
    console.log('No YouTube API key provided, skipping stats fetch');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error('YouTube API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('No video found for ID:', videoId);
      return null;
    }

    const stats = data.items[0].statistics;
    const snippet = data.items[0].snippet;
    const contentDetails = data.items[0].contentDetails;
    return {
      views: parseInt(stats.viewCount || '0', 10),
      likes: parseInt(stats.likeCount || '0', 10),
      comments: parseInt(stats.commentCount || '0', 10),
      publishedAt: snippet.publishedAt,
      duration: contentDetails?.duration ? parseDuration(contentDetails.duration) : null,
    };
  } catch (error) {
    console.error('Error fetching YouTube stats:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Require authentication for this API route
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const videoId = searchParams.get('videoId');

    if (!url && !videoId) {
      return NextResponse.json(
        { error: 'Missing url or videoId parameter' },
        { status: 400 }
      );
    }

    // Extract video ID from URL if provided
    const id = videoId || (url ? extractYouTubeId(url) : null);

    if (!id) {
      return NextResponse.json(
        { error: 'Could not extract YouTube video ID from URL' },
        { status: 400 }
      );
    }

    // Fetch stats
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    const stats = await fetchYouTubeStats(id, youtubeApiKey);

    if (!stats) {
      return NextResponse.json(
        { error: 'Could not fetch YouTube stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in youtube-stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
