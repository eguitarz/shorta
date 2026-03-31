import { NextRequest, NextResponse } from 'next/server';
import { fetchStoryboardSpec, parseStoryboardSpec } from '@/lib/youtube/storyboard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/youtube-storyboard?videoId=XXXXXXXXXXX
 *
 * Returns the parsed storyboard spec for a YouTube video.
 * The client uses this to render frame previews from YouTube's
 * sprite sheet images — zero storage cost.
 *
 * No auth required — this proxies publicly available YouTube data.
 */
export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Valid YouTube video ID required' }, { status: 400 });
  }

  try {
    const specString = await fetchStoryboardSpec(videoId);
    if (!specString) {
      return NextResponse.json({ error: 'Storyboard data not available' }, { status: 404 });
    }

    const spec = parseStoryboardSpec(specString);
    if (!spec) {
      return NextResponse.json({ error: 'Failed to parse storyboard data' }, { status: 500 });
    }

    return NextResponse.json({
      baseUrl: spec.baseUrl,
      sizes: spec.sizes.map(s => ({
        width: s.width,
        height: s.height,
        cols: s.cols,
        rows: s.rows,
        intervalMs: s.intervalMs,
        name: s.name,
        sigh: s.sigh,
      })),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[youtube-storyboard] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch storyboard data' }, { status: 500 });
  }
}
