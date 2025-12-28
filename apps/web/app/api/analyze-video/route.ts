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

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/;
    const isYouTube = youtubeRegex.test(url);

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    let response;

    if (isYouTube && client.analyzeVideo) {
      // Use native Gemini YouTube video analysis (uses gemini-2.5-flash)
      const prompt = `Please analyze this short-form video content and provide:

1. **Summary**: A brief 2-3 sentence overview of what the video is about
2. **Key Points**: Main takeaways or messages (3-5 bullet points)
3. **Hook Analysis**: What makes the opening engaging? How does it grab attention in the first 3 seconds?
4. **Content Structure**: How is the video structured? What's the flow from hook to payoff?
5. **Retention Elements**: What keeps viewers watching? Any pattern interrupts or engagement tactics?
6. **Target Audience**: Who is this content aimed at?
7. **Viral Potential**: What elements make this shareable or viral-worthy?
8. **Improvements**: 3-5 specific, actionable suggestions to make it more engaging

Be specific and reference actual moments in the video using timestamps when relevant.`;

      response = await client.analyzeVideo(url, prompt);
    } else {
      // For non-YouTube URLs, try to fetch and analyze content
      let pageContent = '';
      try {
        const fetchResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Shorta/1.0; +https://shorta.ai)',
          },
        });

        if (fetchResponse.ok) {
          const html = await fetchResponse.text();
          pageContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);
        }
      } catch (error) {
        console.error('Error fetching URL:', error);
      }

      response = await client.chat([
        {
          role: 'user',
          content: `Analyze this content and provide a summary with key insights:

${pageContent || 'No content could be fetched from the URL.'}

Provide a structured analysis with actionable recommendations.`,
        },
      ]);
    }

    return NextResponse.json({
      url,
      analysis: response.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Analyze video API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
