import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';
import type { AnimationBeat, Beat } from '@/lib/types/beat';
import { createRegenerationPrompt } from '@/lib/regenerate-beat-prompt';
import { createAnimationRegenerationPrompt } from '@/lib/animation/regenerate-beat-prompt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { storyboard, beatNumber, locale } = await request.json();

    if (!storyboard || !beatNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: storyboard, beatNumber' },
        { status: 400 }
      );
    }

    const beatToRegenerate = storyboard.beats.find((b: Beat) => b.beatNumber === beatNumber);
    if (!beatToRegenerate) {
      return NextResponse.json(
        { error: `Beat ${beatNumber} not found` },
        { status: 400 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Dispatch: animation storyboards use a dedicated prompt that locks
    // narrativeRole + injects character sheets. Non-animation storyboards
    // use the legacy prompt unchanged.
    const isAnimation = !!storyboard.animation_meta;
    const prompt = isAnimation
      ? createAnimationRegenerationPrompt(
          storyboard,
          beatToRegenerate as AnimationBeat,
          locale
        )
      : createRegenerationPrompt(storyboard, beatToRegenerate, locale);

    console.log('Regenerating beat:', beatNumber);

    const response = await client.chat([
      { role: 'user', content: prompt }
    ], {
      model: 'gemini-3-flash-preview',
      temperature: 0.8, // Slightly higher for more variation
      maxTokens: 4096,
    });

    console.log('Regeneration response received');

    // Parse JSON response
    let jsonContent = response.content.trim();

    // Remove markdown code blocks if present
    if (jsonContent.includes('```')) {
      const match = jsonContent.match(/```(?:json)?\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/);
      if (match) {
        jsonContent = match[1];
      } else {
        jsonContent = jsonContent
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
      }
    }

    const regeneratedBeat = JSON.parse(jsonContent);

    // Preserve timing and beat number from original
    const finalBeat: Beat = {
      ...regeneratedBeat,
      beatNumber: beatToRegenerate.beatNumber,
      startTime: beatToRegenerate.startTime,
      endTime: beatToRegenerate.endTime,
    };

    return NextResponse.json({ beat: finalBeat });
  } catch (error) {
    console.error('Regenerate beat error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate beat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

