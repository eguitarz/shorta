import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { requireAuth, getAuthenticatedUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  // Require authentication for this API route
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  // Get authenticated user for database save
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { storyboard, approvedChanges, url, analysisJobId } = await request.json();

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
    console.log('Number of beats:', updatedBeats.length);
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

      console.log('Received response from LLM');
      console.log('Response content length:', response.content.length);
      console.log('First 200 chars:', response.content.substring(0, 200));

      // Try to extract JSON if it's wrapped in markdown code blocks
      let jsonContent = response.content.trim();

      // Remove markdown code blocks - handle various formats
      if (jsonContent.includes('```')) {
        // Try multiple patterns
        // Pattern 1: ```json\n{...}\n```
        let match = jsonContent.match(/```(?:json)?\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/);
        if (match) {
          jsonContent = match[1];
          console.log('Extracted JSON from code block (pattern 1)');
        } else {
          // Pattern 2: Just strip all ``` and json markers
          jsonContent = jsonContent
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          console.log('Removed all code block markers (pattern 2)');
        }
      }

      console.log('JSON to parse (first 200 chars):', jsonContent.substring(0, 200));
      generatedStoryboard = JSON.parse(jsonContent);
      console.log('Successfully parsed JSON, beats count:', generatedStoryboard.beats?.length);
    } catch (error) {
      console.error('Generation error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Failed to generate storyboard', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Save to database
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // API route - ignore cookie setting errors
            }
          },
        },
      }
    );

    // Extract searchable metadata from overview
    const overview = storyboard.overview || {};
    const title = overview.title || 'Untitled Storyboard';

    const { data: savedStoryboard, error: saveError } = await supabase
      .from('generated_storyboards')
      .insert({
        user_id: user.id,
        analysis_job_id: analysisJobId,
        title,
        original_overview: storyboard.overview,
        original_beats: storyboard.beats,
        generated_overview: storyboard.overview,
        generated_beats: generatedStoryboard.beats,
        applied_changes: approvedChanges,
        // Searchable metadata for AI
        niche_category: overview.nicheCategory || null,
        content_type: overview.contentType || null,
        hook_pattern: overview.hookPattern || null,
        video_length_seconds: overview.length || null,
        changes_count: approvedChanges.length,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Failed to save storyboard:', saveError);
      // Continue without failing - still return the generated data
      // This way the user can see the result even if DB save fails
    }

    const storyboardId = savedStoryboard?.id;
    console.log('Saved storyboard with ID:', storyboardId);

    return NextResponse.json({
      storyboard_id: storyboardId,
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
- FORMAT DIRECTOR NOTES AS BULLET POINTS (3-5 actionable points per beat)
- HIGHLIGHT CRITICAL NOTES: Wrap the 1-2 MOST IMPORTANT notes in **double asterisks** for emphasis
- Example: "• **Start with direct eye contact - this is crucial**\n• Use high energy throughout\n• Cut to B-roll at 0:03"
- Only highlight notes that are truly critical to the beat's success
- LANGUAGE ALIGNMENT (CRITICAL): ALL output (directorNotes, script, visual, audio) MUST be in the SAME language as the original transcript. If the original script is in English, output ONLY in English. Do NOT switch to Hindi or any other language.

VISUAL FORMATTING:
- 2-3 concise bullet points maximum
- Format: "• Camera angle/shot type\\n• Key visual element\\n• Context/setting"
- Examples: "• Medium close-up", "• Natural home setting", "• Hold prop for context"
- Keep each bullet under 10 words

AUDIO FORMATTING:
- 1-2 concise bullet points maximum
- Format: "• Music description\\n• Sound effect (if needed)"
- Examples: "• Upbeat acoustic guitar", "• Subtle whoosh on text reveal"
- Keep each bullet under 8 words

Return a JSON object with this structure:
{
  "beats": [
    {
      "beatNumber": 1,
      "startTime": 0,
      "endTime": 3,
      "type": "hook",
      "title": "Beat title",
      "directorNotes": "• First actionable instruction\n• Second instruction\n• Third instruction",
      "script": "What to say (same as original unless fix changes it)",
      "visual": "• Medium close-up\n• Natural setting\n• Direct eye contact",
      "audio": "• Upbeat acoustic music\n• Subtle whoosh effect"
    }
  ]
}`;
}
