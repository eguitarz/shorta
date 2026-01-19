import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';
import { getLanguageName } from '@/lib/i18n-helpers';

export const dynamic = 'force-dynamic';

interface EditMessage {
  role: 'user' | 'assistant';
  content: string;
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

interface ProposedChanges {
  directorNotes?: string;
  script?: string;
  visual?: string;
  audio?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyboard, beatNumber, messages, locale } = body;
    let { currentBeat } = body;

    if (!storyboard || !beatNumber || !messages) {
      const missing = [];
      if (!storyboard) missing.push('storyboard');
      if (!beatNumber) missing.push('beatNumber');
      if (!messages) missing.push('messages');

      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // If currentBeat is missing, find it from the storyboard
    if (!currentBeat) {
      currentBeat = storyboard.beats.find((b: any) => b.beatNumber === Number(beatNumber));
    }

    if (!currentBeat) {
      return NextResponse.json(
        { error: `Beat ${beatNumber} not found in storyboard data` },
        { status: 400 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Build prompt with full context
    const editPrompt = createEditPrompt(storyboard, beatNumber, currentBeat, messages, locale);

    console.log('Editing beat:', beatNumber);

    const response = await client.chat([
      { role: 'user', content: editPrompt }
    ], {
      temperature: 0.7,
      maxTokens: 4096,
    });

    console.log('Edit response received');

    // Try to extract JSON for proposed changes
    let proposedChanges: ProposedChanges | null = null;
    const jsonMatch = response.content.match(/```(?:json)?\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/);

    if (jsonMatch) {
      try {
        proposedChanges = JSON.parse(jsonMatch[1]);
        console.log('Extracted proposed changes:', proposedChanges);
      } catch (e) {
        console.log('Failed to parse JSON from response');
      }
    }

    // Return conversational message + proposed changes if available
    return NextResponse.json({
      message: response.content.replace(/```(?:json)?\s*\n?\s*\{[\s\S]*?\}\s*\n?\s*```/g, '').trim(),
      proposedChanges,
    });
  } catch (error) {
    console.error('Edit beat error:', error);
    return NextResponse.json(
      { error: 'Failed to edit beat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function createEditPrompt(
  storyboard: Storyboard,
  beatNumber: number,
  currentBeat: Beat,
  messages: EditMessage[],
  locale?: string
): string {
  const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n');

  // Format director notes
  const directorNotes = Array.isArray(currentBeat.directorNotes)
    ? currentBeat.directorNotes.join('\n')
    : currentBeat.directorNotes;

  return `You are helping a video creator refine their storyboard. The user is editing Beat ${beatNumber}.

FULL VIDEO CONTEXT:
Title: ${storyboard.overview.title}
Format: ${storyboard.overview.contentType}
Total Length: ${storyboard.overview.length}s
All Beats: ${storyboard.beats.map(b => `Beat ${b.beatNumber}: ${b.title} (${b.startTime}s-${b.endTime}s)`).join(', ')}

CURRENT BEAT ${beatNumber}:
Title: ${currentBeat.title}
Timing: ${currentBeat.startTime}s - ${currentBeat.endTime}s
Type: ${currentBeat.type}

Director Notes:
${directorNotes}

Script: ${currentBeat.script}
Visual: ${currentBeat.visual}
Audio: ${currentBeat.audio}

CONVERSATION:
${conversation}

Based on the user's request, provide:
1. A conversational response explaining what you'll change
2. The proposed changes in JSON format

IMPORTANT CONSTRAINTS:
- Maintain narrative flow with other beats
- Don't exceed total video length (${storyboard.overview.length}s)
- Keep consistent tone with overall ${storyboard.overview.contentType} style
- If changing timing, ensure it doesn't conflict with adjacent beats

Response format:
[Your conversational explanation of changes]

\`\`\`json
{
  "directorNotes": "Updated notes as bullet points with \\n separators",
  "script": "Updated script (only if changed)",
  "visual": "Updated visual (only if changed)",
  "audio": "Updated audio (only if changed)"
}
\`\`\`

Only include fields that actually changed. If just refining wording without major changes, you can omit the JSON and just provide conversational feedback.

${locale && locale !== 'en' ? `IMPORTANT LANGUAGE REQUIREMENT: Your conversational response AND all content within the JSON (directorNotes, script, visual, audio) MUST be written in ${getLanguageName(locale)}. This is CRITICAL.` : ''}`;
}
