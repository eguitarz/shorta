import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ApprovedChange {
  id: string;
  type: 'fix' | 'variant';
  beatNumber?: number;
  beatTitle?: string;
  issue?: {
    severity: string;
    message: string;
    suggestion: string;
  };
  variant?: {
    index: number;
    label: string;
    text: string;
  };
}

interface Beat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
  title: string;
  transcript: string;
  visual: string;
  audio: string;
  retention?: any;
}

interface GeneratedBeat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
  title: string;
  directorNotes: string;
  script: string;
  visual: string;
  audio: string;
}

export async function POST(request: NextRequest) {
  try {
    const { storyboard, approvedChanges, url } = await request.json();

    if (!storyboard || !approvedChanges) {
      return NextResponse.json(
        { error: 'Storyboard and approved changes are required' },
        { status: 400 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Apply approved changes to storyboard
    const updatedBeats = applyApprovedChanges(storyboard.beats, approvedChanges);

    // Generate director-style storyboard
    const generationPrompt = createGenerationPrompt(updatedBeats, storyboard.overview);

    console.log('Generating director storyboard...');
    let generatedStoryboard;

    try {
      const response = await client.chat([
        {
          role: 'user',
          content: generationPrompt,
        }
      ], {
        temperature: 0.7,
        maxTokens: 16384,
      });

      generatedStoryboard = JSON.parse(response.content);
    } catch (error) {
      console.error('Generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate storyboard', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url,
      original: {
        overview: storyboard.overview,
        beats: storyboard.beats,
      },
      generated: {
        overview: storyboard.overview,
        beats: generatedStoryboard.beats,
      },
      appliedChanges: approvedChanges,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Generate storyboard error:', error);
    return NextResponse.json(
      { error: 'Failed to generate storyboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function applyApprovedChanges(beats: Beat[], approvedChanges: ApprovedChange[]): Beat[] {
  const updatedBeats = [...beats];

  // Apply fixes to specific beats
  approvedChanges.forEach(change => {
    if (change.type === 'fix' && change.beatNumber !== undefined) {
      const beatIndex = updatedBeats.findIndex(b => b.beatNumber === change.beatNumber);
      if (beatIndex !== -1 && change.issue?.suggestion) {
        // Store the suggestion to be applied in generation
        updatedBeats[beatIndex] = {
          ...updatedBeats[beatIndex],
          appliedFix: change.issue.suggestion,
        } as any;
      }
    }
  });

  // Apply re-hook variant (affects beat 1)
  const hookVariant = approvedChanges.find(change => change.type === 'variant');
  if (hookVariant && hookVariant.variant) {
    const hookBeatIndex = updatedBeats.findIndex(b => b.beatNumber === 1);
    if (hookBeatIndex !== -1) {
      updatedBeats[hookBeatIndex] = {
        ...updatedBeats[hookBeatIndex],
        transcript: hookVariant.variant.text,
        appliedVariant: true,
      } as any;
    }
  }

  return updatedBeats;
}

function createGenerationPrompt(beats: Beat[], overview: any): string {
  const beatsDescription = beats.map(beat => {
    const appliedFix = (beat as any).appliedFix;
    const appliedVariant = (beat as any).appliedVariant;

    return `
Beat ${beat.beatNumber}: ${beat.title} (${beat.startTime}s - ${beat.endTime}s)
Type: ${beat.type}
Script: ${beat.transcript}
Visual: ${beat.visual}
Audio: ${beat.audio}
${appliedFix ? `\nAPPLIED FIX: ${appliedFix}` : ''}
${appliedVariant ? '\nNOTE: This is a re-written hook variant' : ''}
    `.trim();
  }).join('\n\n');

  return `You are an expert video director providing detailed shooting instructions to a creator.

Given the video storyboard below, generate a NEW storyboard where each beat contains:
1. Director's notes - Detailed instructions on HOW to shoot this beat for maximum engagement
2. Updated script, visual, and audio descriptions incorporating any applied fixes

VIDEO OVERVIEW:
Title: ${overview.title}
Format: ${overview.contentType}
Niche: ${overview.nicheCategory}
Target Audience: ${overview.targetAudience}

ORIGINAL STORYBOARD WITH APPLIED CHANGES:
${beatsDescription}

IMPORTANT GUIDELINES:
- Write director notes as direct instructions to the creator (e.g., "Start with a close-up of...", "Maintain high energy throughout...")
- Focus on WHAT to do, not what's wrong
- Be specific about camera angles, pacing, energy, delivery
- If a fix was applied, incorporate that guidance naturally into the director notes
- Keep the same beat structure (number, timing, type)
- Maintain the original script/visual/audio unless a fix specifically changes them
- No analysis or issues - only actionable shooting instructions

Return a JSON object with this structure:
{
  "beats": [
    {
      "beatNumber": 1,
      "startTime": 0,
      "endTime": 3,
      "type": "hook",
      "title": "Beat title",
      "directorNotes": "Detailed instructions for shooting this beat...",
      "script": "What to say (same as original unless fix changes it)",
      "visual": "What to show (same as original unless fix changes it)",
      "audio": "Audio elements (same as original unless fix changes it)"
    }
  ]
}`;
}
