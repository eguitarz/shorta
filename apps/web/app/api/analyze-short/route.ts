import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { requireAuthWithCsrfAndRateLimit } from '@/lib/auth-helpers';
import { validateExternalUrl } from '@/lib/url-validation';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Require authentication, CSRF protection, and rate limiting
  const authError = await requireAuthWithCsrfAndRateLimit(request);
  if (authError) {
    return authError;
  }

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

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/;
    const isYouTube = youtubeRegex.test(url);

    let cachedContent;
    let classification;
    let response;

    if (isYouTube && client.createVideoCache) {
      // Step 0: Create cache for the video (saves tokens for multiple calls)
      try {
        cachedContent = await client.createVideoCache(url);
        console.log('Cache created:', cachedContent.name);
      } catch (error) {
        console.error('Cache creation error:', error);
        // Continue without cache if it fails
      }
    }

    if (isYouTube && client.classifyVideo) {
      // Step 1: Classify the video format using cached content
      try {
        classification = await client.classifyVideo(url, undefined, cachedContent?.name);
      } catch (error) {
        console.error('Classification error:', error);
        return NextResponse.json(
          { error: 'Failed to classify video format' },
          { status: 500 }
        );
      }
    }

    if (isYouTube && client.analyzeVideo) {
      // Use native Gemini YouTube video analysis
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

      // Step 2: Analyze using cached content
      response = await client.analyzeVideo(url, prompt, undefined, cachedContent?.name);
    } else {
      // For non-YouTube URLs, validate URL to prevent SSRF
      const urlValidation = validateExternalUrl(url);
      if (!urlValidation.isValid) {
        return NextResponse.json(
          { error: urlValidation.error || 'Invalid URL' },
          { status: 400 }
        );
      }

      // Try to fetch and analyze content
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
      classification,
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
