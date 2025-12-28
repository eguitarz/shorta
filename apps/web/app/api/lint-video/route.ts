import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { VideoLinter } from '@/lib/linter';
import type { VideoFormat } from '@/lib/linter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, format } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!format) {
      return NextResponse.json(
        { error: 'Format is required' },
        { status: 400 }
      );
    }

    if (!['talking_head', 'gameplay', 'other'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be: talking_head, gameplay, or other' },
        { status: 400 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Create linter (uses gemini-2.5-flash for analysis)
    const linter = new VideoLinter(client);

    // Lint the video based on format
    let lintResult;
    try {
      lintResult = await linter.lint(url, format as VideoFormat);
    } catch (error) {
      console.error('Linting error:', error);
      return NextResponse.json(
        { error: 'Failed to lint video' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url,
      format,
      lintResult,
    });
  } catch (error) {
    console.error('Lint video API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
