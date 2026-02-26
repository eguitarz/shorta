import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';
import { getLanguageName } from '@/lib/i18n-helpers';

export const dynamic = 'force-dynamic';

interface TextOverlay {
  text: string;
  position: 'top' | 'center' | 'bottom' | 'lower-third';
  timing: string;
}

interface Beat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
  title: string;
  directorNotes: string | string[];
  script: string;
  visual: string;
  audio: string;
  shotType?: string;
  cameraMovement?: string;
  transition?: string;
  textOverlays?: TextOverlay[];
  bRollSuggestions?: string[];
  retentionTip?: string;
}

interface Storyboard {
  overview: {
    title: string;
    contentType: string;
    nicheCategory: string;
    targetAudience: string;
    length: number;
  };
  beats: Beat[];
}

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

    // Create regeneration prompt
    const prompt = createRegenerationPrompt(storyboard, beatToRegenerate, locale);

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

function createRegenerationPrompt(storyboard: Storyboard, beat: Beat, locale?: string): string {
  const prevBeat = storyboard.beats.find(b => b.beatNumber === beat.beatNumber - 1);
  const nextBeat = storyboard.beats.find(b => b.beatNumber === beat.beatNumber + 1);

  const duration = beat.endTime - beat.startTime;

  return `You are an expert video director. Regenerate this beat with a FRESH, DIFFERENT approach while maintaining coherence with the overall video.

VIDEO CONTEXT:
- Title: ${storyboard.overview.title}
- Format: ${storyboard.overview.contentType}
- Niche: ${storyboard.overview.nicheCategory}
- Target Audience: ${storyboard.overview.targetAudience}
- Total Length: ${storyboard.overview.length}s

BEAT TO REGENERATE (Beat ${beat.beatNumber}):
- Type: ${beat.type}
- Duration: ${duration} seconds (${beat.startTime}s - ${beat.endTime}s)
- Current Title: ${beat.title}
- Current Script: ${beat.script}

${prevBeat ? `PREVIOUS BEAT (Beat ${prevBeat.beatNumber}):
- Type: ${prevBeat.type}
- Script: ${prevBeat.script}
- Ends with: ${prevBeat.transition || 'cut'}
` : 'This is the FIRST beat.'}

${nextBeat ? `NEXT BEAT (Beat ${nextBeat.beatNumber}):
- Type: ${nextBeat.type}
- Script: ${nextBeat.script}
` : 'This is the LAST beat.'}

REQUIREMENTS:
1. Create a COMPLETELY FRESH version of this beat
2. Keep the same beat type (${beat.type}) and duration (${duration}s)
3. Ensure smooth flow from previous beat and into next beat
4. Be creative - don't just rephrase, try a different angle or approach
5. Match the overall tone and style of the video
6. CONSISTENCY: This beat is part of the SAME video as the other beats. Maintain the same setting, lighting, wardrobe, audio style, and text overlay style. Only change what needs to be fresh (script, angle, approach), not the production identity.
7. Only include textOverlays if they genuinely reinforce this beat's message. Omit if not needed.
8. Only include bRollSuggestions if cutaways genuinely enhance this beat. Omit if the main shot is sufficient.
9. Only include retentionTip if there's a unique insight. Omit if it would be generic.

Return ONLY valid JSON (no markdown):
{
  "type": "${beat.type}",
  "title": "New descriptive title for the beat",
  "directorNotes": "• First shooting instruction\\n• Second instruction\\n• **Critical instruction highlighted**\\n• Fourth instruction",
  "script": "Fresh script for what to say (${duration}s worth)",
  "visual": "• Visual instruction 1\\n• Visual instruction 2\\n• Visual instruction 3",
  "audio": "• Audio instruction 1\\n• Audio instruction 2",
  "shotType": "MCU",
  "cameraMovement": "static",
  "transition": "cut"
}

Optional fields (include ONLY when they add value):
  "textOverlays": [{ "text": "...", "position": "center", "timing": "0:01-0:03" }]
  "bRollSuggestions": ["B-roll idea 1", "B-roll idea 2"]
  "retentionTip": "Why viewers stay engaged during this beat"

Shot types: CU, MCU, MS, MLS, WS, OTS, POV, INSERT
Camera movements: static, pan, tilt, track, zoom, handheld, dolly
Transitions: cut, dissolve, fade, zoom, swipe, whip, none
Text positions: top, center, bottom, lower-third
${locale && locale !== 'en' ? `\nIMPORTANT: Write ALL text content (scripts, titles, director notes, etc.) in ${getLanguageName(locale)}.` : ''}`;
}
