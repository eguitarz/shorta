import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { requireAuth } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Require authentication for this API route
  const authError = await requireAuth(request);
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

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/;
    const isYouTube = youtubeRegex.test(url);

    if (!isYouTube) {
      return NextResponse.json(
        { error: 'Only YouTube URLs are supported for video classification' },
        { status: 400 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    if (!client.classifyVideo) {
      return NextResponse.json(
        { error: 'Client does not support video classification' },
        { status: 500 }
      );
    }

    // Classify the video format (uses gemini-2.5-flash-lite)
    let classification;
    try {
      classification = await client.classifyVideo(url);
    } catch (error) {
      console.error('Classification error:', error);
      return NextResponse.json(
        { error: 'Failed to classify video format' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url,
      classification,
    });
  } catch (error) {
    console.error('Classify video API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
