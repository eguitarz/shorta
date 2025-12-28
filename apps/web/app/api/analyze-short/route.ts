import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Extract video ID if it's a YouTube URL
    let videoInfo = '';
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      const videoId = match[1];
      videoInfo = `This is a YouTube Short/video with ID: ${videoId}. Since I cannot access the actual video content, please provide a general framework for analyzing short-form video content.`;
    } else {
      // For non-YouTube URLs, try to fetch content
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Shorta/1.0; +https://shorta.ai)',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();

        // Basic HTML to text conversion (strip tags)
        videoInfo = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000); // Limit to 5000 chars to avoid token limits

      } catch (error) {
        console.error('Error fetching URL:', error);
        videoInfo = 'Unable to fetch content from URL. Please provide a general analysis framework.';
      }
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Ask Gemini to analyze
    const response = await client.chat([
      {
        role: 'user',
        content: `You are a short-form video content analyst. I'm providing you information about a video that needs analysis.

${videoInfo}

Please provide a comprehensive analysis framework for short-form video content with the following sections:

1. **Content Analysis Framework**: What elements make a short-form video successful
2. **Hook Strategies**: 5 proven hook techniques for the first 3 seconds
3. **Retention Tactics**: Key strategies to keep viewers watching
4. **Viral Elements**: What makes content shareable and engaging
5. **Optimization Tips**: Specific recommendations for maximizing engagement

Format your response in a clear, structured way with specific actionable advice.`,
      },
    ]);

    return NextResponse.json({
      url,
      summary: response.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Analyze short API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
