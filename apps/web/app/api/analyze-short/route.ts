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

    // Fetch the content from the URL
    let pageContent: string;
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
      // For a more robust solution, consider using a library or extracting specific meta tags
      pageContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000); // Limit to 5000 chars to avoid token limits

    } catch (error) {
      console.error('Error fetching URL:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content from URL' },
        { status: 500 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Ask Gemini to summarize
    const response = await client.chat([
      {
        role: 'user',
        content: `Please analyze and summarize this short-form video or content from the following URL content. Provide:

1. **Summary**: A brief 2-3 sentence overview of what the content is about
2. **Key Points**: Main takeaways or messages (3-5 bullet points)
3. **Hook Analysis**: What makes this content engaging or viral-worthy
4. **Target Audience**: Who this content is aimed at
5. **Improvements**: 2-3 suggestions to make it more engaging

URL: ${url}

Content:
${pageContent}

Keep your response structured and concise.`,
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
