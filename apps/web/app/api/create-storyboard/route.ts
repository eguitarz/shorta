import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { requireAuth, getAuthenticatedUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface ViralPatterns {
  hookPatterns: string[];
  structurePatterns: string[];
  commonElements: string[];
  averageViews: number;
  videosAnalyzed: number;
  timestamp: string;
}

interface CreateStoryboardInput {
  topic: string;
  format: string;
  targetLength: number;
  keyPoints: string[];
  targetAudience?: string;
  contentType?: string;
  viralPatterns?: ViralPatterns;
}

// Shot types for professional video production
export type ShotType = 'CU' | 'MCU' | 'MS' | 'MLS' | 'WS' | 'OTS' | 'POV' | 'INSERT';
export type CameraMovement = 'static' | 'pan' | 'tilt' | 'track' | 'zoom' | 'handheld' | 'dolly';
export type TransitionType = 'cut' | 'dissolve' | 'fade' | 'zoom' | 'swipe' | 'whip' | 'none';

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
  directorNotes: string;
  script: string;
  visual: string;
  audio: string;
  // Enhanced fields
  shotType?: ShotType;
  cameraMovement?: CameraMovement;
  transition?: TransitionType;
  textOverlays?: TextOverlay[];
  bRollSuggestions?: string[];
  retentionTip?: string;
}

// Hook variant styles aligned with rehook presets
export type HookVariantStyle = 'bold' | 'question' | 'emotional' | 'specific';

interface HookVariant {
  id: string;
  style: HookVariantStyle;
  label: string;
  script: string;
  visual: string;
  audio: string;
  directorNotes: string;
  whyItWorks: string;
}

interface Overview {
  title: string;
  contentType: string;
  nicheCategory: string;
  targetAudience: string;
  length: number;
}

interface Storyboard {
  overview: Overview;
  beats: Beat[];
  hookVariants?: HookVariant[];
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
    const input: CreateStoryboardInput = await request.json();

    if (!input.topic || !input.format || !input.targetLength || !input.keyPoints) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, format, targetLength, keyPoints' },
        { status: 400 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Create generation prompt
    const prompt = createGenerationPrompt(input);

    console.log('Creating storyboard from scratch...');
    console.log('Input:', input);

    let storyboard: Storyboard;

    try {
      const response = await client.chat([
        {
          role: 'user',
          content: prompt,
        }
      ], {
        model: 'gemini-3-flash-preview',
        temperature: 0.7,
        maxTokens: 16384,
      });

      console.log('Received response from LLM');
      console.log('Response content length:', response.content.length);

      // Parse JSON response
      let jsonContent = response.content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.includes('```')) {
        const match = jsonContent.match(/```(?:json)?\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/);
        if (match) {
          jsonContent = match[1];
          console.log('Extracted JSON from code block');
        } else {
          jsonContent = jsonContent
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          console.log('Removed all code block markers');
        }
      }

      console.log('JSON to parse (first 200 chars):', jsonContent.substring(0, 200));
      storyboard = JSON.parse(jsonContent);
      console.log('Successfully parsed JSON, beats count:', storyboard.beats?.length);
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

    const overview = storyboard.overview;
    const title = overview?.title || input.topic || 'Untitled Storyboard';

    const insertData = {
      user_id: user.id,
      analysis_job_id: null, // Created from scratch, not from analysis
      source: 'created', // Distinguish from 'analyzed' storyboards
      title,
      original_overview: overview,
      original_beats: storyboard.beats, // Store generated beats as original too
      generated_overview: overview,
      generated_beats: storyboard.beats,
      applied_changes: [], // No changes applied
      hook_variants: storyboard.hookVariants || null, // Store hook variants
      // Searchable metadata
      niche_category: overview?.nicheCategory || null,
      content_type: overview?.contentType || input.contentType || null,
      hook_pattern: null,
      video_length_seconds: overview?.length || input.targetLength || null,
      changes_count: 0,
    };

    console.log('Inserting storyboard with data:', {
      user_id: insertData.user_id,
      source: insertData.source,
      title: insertData.title,
      beats_count: insertData.generated_beats?.length,
      hook_variants_count: insertData.hook_variants?.length,
    });

    const { data: savedStoryboard, error: saveError } = await supabase
      .from('generated_storyboards')
      .insert(insertData)
      .select('id')
      .single();

    if (saveError) {
      console.error('Failed to save storyboard:', saveError);
      console.error('Save error details:', {
        code: saveError.code,
        message: saveError.message,
        details: saveError.details,
        hint: saveError.hint,
      });
      // Continue without failing - still return the generated data
    }

    const storyboardId = savedStoryboard?.id;
    console.log('Saved created storyboard with ID:', storyboardId);

    return NextResponse.json({
      id: storyboardId,
      overview: storyboard.overview,
      beats: storyboard.beats,
      hookVariants: storyboard.hookVariants || [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create storyboard error:', error);
    return NextResponse.json(
      { error: 'Failed to create storyboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function createGenerationPrompt(input: CreateStoryboardInput): string {
  const keyPointsList = input.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n');

  // Build viral patterns section if available
  const viralPatternsSection = input.viralPatterns ? `

VIRAL PATTERNS ANALYSIS:
Based on analysis of ${input.viralPatterns.videosAnalyzed} recent viral videos in this niche (avg views: ${input.viralPatterns.averageViews.toLocaleString()}), incorporate these proven patterns:

Hook Patterns:
${input.viralPatterns.hookPatterns.map(p => `• ${p}`).join('\n')}

Content Structure Patterns:
${input.viralPatterns.structurePatterns.map(p => `• ${p}`).join('\n')}

Common Successful Elements:
${input.viralPatterns.commonElements.map(p => `• ${p}`).join('\n')}

IMPORTANT: Your storyboard should naturally incorporate these viral patterns. Don't force them, but use them as a blueprint for success.
` : '';

  const hookDuration = Math.min(5, Math.floor(input.targetLength * 0.15));

  return `You are an expert video director creating a storyboard for short-form content.

Create a complete storyboard for a ${input.format} video with the following details:

VIDEO DETAILS:
- Topic: ${input.topic}
- Format: ${input.format}
- Target Length: ${input.targetLength} seconds
- Content Type: ${input.contentType || 'educational'}
- Target Audience: ${input.targetAudience || 'general audience'}

KEY POINTS TO COVER:
${keyPointsList}${viralPatternsSection}

STRUCTURE REQUIREMENTS:
1. Break the video into ${getBeatCount(input.targetLength, input.keyPoints.length)} beats (hook, setup, main points, payoff, CTA)
2. Each beat should have:
   - Beat number (starting from 1)
   - Start and end time (in seconds)
   - Type (hook, setup, main_content, payoff, cta)
   - Title (descriptive name)
   - Director notes (3-5 bullet points with actionable shooting instructions)
   - Script (what to say)
   - Visual (what to show)
   - Audio (music, sound effects)
   - Shot type: CU (close-up), MCU (medium close-up), MS (medium shot), MLS (medium long shot), WS (wide shot), OTS (over-the-shoulder), POV, INSERT
   - Camera movement: static, pan, tilt, track, zoom, handheld, dolly
   - Transition to next beat: cut, dissolve, fade, zoom, swipe, whip, none
   - Text overlays: array of text to appear on screen with position and timing
   - B-roll suggestions: 2-3 ideas for supplementary footage
   - Retention tip: brief note on why this beat keeps viewers watching

HOOK VARIANTS REQUIREMENT:
Generate 4 different hook options with distinct styles. Each variant should:
- Cover the same hook duration (0-${hookDuration}s)
- Have the same timing as Beat 1 but with different approaches
- Include a brief explanation of why it works

The 4 hook styles are:
1. BOLD: Make a confident claim or promise. Lead with the result or outcome. Be assertive and direct. Use power words.
2. QUESTION: Open with a thought-provoking question or create a curiosity gap. Make viewers NEED to know the answer.
3. EMOTIONAL: Connect with the viewer's struggle, pain point, or desire. Use empathy, urgency, and relatability.
4. SPECIFIC: Lead with concrete numbers, data, timeframes, or specific results. Ground the hook in measurable outcomes.

DIRECTOR NOTES GUIDELINES:
- Start with action verbs (Start, Show, Cut, Maintain, etc.)
- Be specific about camera angles, pacing, energy, delivery
- Keep each point concise and actionable
- Format as bullet points: "• First instruction\\n• Second instruction"
- 3-5 points per beat
- HIGHLIGHT CRITICAL NOTES: Wrap the 1-2 MOST IMPORTANT notes in **double asterisks** for emphasis
- Example: "• **Start with direct eye contact - this is crucial**\\n• Use high energy throughout\\n• Cut to B-roll at 0:03"
- Only highlight notes that are truly critical to the beat's success

VISUAL GUIDELINES:
- 2-3 concise bullet points maximum
- Format: "• Camera angle/shot type\\n• Key visual element\\n• Context/setting"
- Examples: "• Medium close-up", "• Natural home setting", "• Hold prop for context"
- Keep each bullet under 10 words

AUDIO GUIDELINES:
- 1-2 concise bullet points maximum
- Format: "• Music description\\n• Sound effect (if needed)"
- Examples: "• Upbeat acoustic guitar", "• Subtle whoosh on text reveal"
- Keep each bullet under 8 words

TIMING GUIDELINES:
- Hook: 0-${hookDuration}s (grab attention immediately)
- Setup: Brief context if needed (20-25% of video)
- Main content: Cover all key points (50-60% of video)
- Payoff: Deliver the conclusion (10-15% of video)
- CTA: Clear next step (last 3-5 seconds)

Return VALID JSON ONLY in this format:
{
  "overview": {
    "title": "${input.topic}",
    "contentType": "${input.contentType || 'educational'}",
    "nicheCategory": "appropriate category based on topic",
    "targetAudience": "${input.targetAudience || 'general audience'}",
    "length": ${input.targetLength}
  },
  "hookVariants": [
    {
      "id": "bold",
      "style": "bold",
      "label": "Bold & Direct",
      "script": "The direct, confident opening script",
      "visual": "• Close-up shot\\n• Confident posture\\n• Direct eye contact",
      "audio": "• Powerful intro beat\\n• Quick sound effect",
      "directorNotes": "• **Lead with confidence**\\n• Maintain strong eye contact\\n• Speak with authority",
      "whyItWorks": "A brief 1-2 sentence explanation of why this hook style works for this topic"
    },
    {
      "id": "question",
      "style": "question",
      "label": "Curiosity Hook",
      "script": "The question or curiosity-gap opening",
      "visual": "• Medium shot\\n• Curious expression\\n• Lean in slightly",
      "audio": "• Intriguing music\\n• Pause for effect",
      "directorNotes": "• **Pause after the question**\\n• Show genuine curiosity\\n• Create tension",
      "whyItWorks": "A brief 1-2 sentence explanation of why this hook style works for this topic"
    },
    {
      "id": "emotional",
      "style": "emotional",
      "label": "Pain Point",
      "script": "The empathetic, relatable opening",
      "visual": "• Warm lighting\\n• Relatable setting\\n• Empathetic expression",
      "audio": "• Soft intro music\\n• Conversational tone",
      "directorNotes": "• **Connect emotionally first**\\n• Show understanding\\n• Be authentic",
      "whyItWorks": "A brief 1-2 sentence explanation of why this hook style works for this topic"
    },
    {
      "id": "specific",
      "style": "specific",
      "label": "Data-Driven",
      "script": "The opening with specific numbers or metrics",
      "visual": "• Text overlay with number\\n• Medium shot\\n• Authoritative stance",
      "audio": "• Clean, professional intro\\n• Subtle emphasis sound",
      "directorNotes": "• **Emphasize the number clearly**\\n• Let the data speak\\n• Show credibility",
      "whyItWorks": "A brief 1-2 sentence explanation of why this hook style works for this topic"
    }
  ],
  "beats": [
    {
      "beatNumber": 1,
      "startTime": 0,
      "endTime": ${hookDuration},
      "type": "hook",
      "title": "Hook - [Descriptive Title]",
      "directorNotes": "• First actionable instruction\\n• Second instruction\\n• Third instruction",
      "script": "Use the BOLD hook variant as the default Beat 1 script",
      "visual": "• Medium close-up\\n• Natural setting\\n• Direct eye contact",
      "audio": "• Upbeat acoustic music\\n• Subtle whoosh effect",
      "shotType": "MCU",
      "cameraMovement": "static",
      "transition": "cut",
      "textOverlays": [
        { "text": "Key phrase or hook text", "position": "center", "timing": "0:01-0:03" }
      ],
      "bRollSuggestions": ["Relevant visual example", "Supporting footage idea"],
      "retentionTip": "Brief explanation of why viewers stay for this beat"
    }
  ]
}

IMPORTANT:
- The "beats" array Beat 1 should use the BOLD hook variant as default
- All 4 hookVariants must have COMPLETELY DIFFERENT scripts that achieve the same goal differently
- Each hookVariant.whyItWorks should be specific to the topic, not generic
- Make each hook genuinely distinct - not just word variations

NO markdown code blocks. Return ONLY the JSON object.`;
}

function getBeatCount(length: number, keyPointsCount: number): number {
  // Minimum: hook + CTA = 2 beats
  // Add beats based on key points and length
  if (length <= 30) {
    return Math.min(3, keyPointsCount + 2); // Short videos: 3-5 beats max
  } else if (length <= 60) {
    return keyPointsCount + 2; // Hook + points + CTA
  } else {
    return keyPointsCount + 3; // Hook + setup + points + payoff + CTA
  }
}
