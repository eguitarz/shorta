import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { requireAuth, getAuthenticatedUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getLanguageName } from '@/lib/i18n-helpers';
import { hasSufficientCreditsForStoryboard, chargeUserForStoryboard } from '@/lib/storyboard-usage';

export const dynamic = 'force-dynamic';

interface ViralPatterns {
  hookPatterns: string[];
  structurePatterns: string[];
  commonElements: string[];
  averageViews: number;
  videosAnalyzed: number;
  timestamp: string;
  videos?: Array<{
    title: string;
    views: number;
  }>;
}

interface LibraryInsight {
  recommendedHookStyle?: string;
  referenceVideoTitle?: string;
  referenceHookText?: string;
  insightSummary?: string;
}

interface CreateStoryboardInput {
  topic: string;
  format: string;
  targetLength: number;
  keyPoints: string[];
  targetAudience?: string;
  contentType?: string;
  viralPatterns?: ViralPatterns;
  libraryInsights?: LibraryInsight;
  locale?: string;
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
export type HookVariantStyle = 'bold' | 'question' | 'emotional' | 'specific' | 'library' | 'viral';

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

    // Create Supabase client (needed for usage check and save)
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

    // Check if user has enough credits
    const hasCredits = await hasSufficientCreditsForStoryboard(supabase, user.id);
    if (!hasCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: 'You don\'t have enough credits to create a storyboard. Please upgrade your plan.',
        },
        { status: 403 }
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
        model: 'gemini-3-pro-preview',
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

    // Charge credits after successful generation
    const { error: chargeError } = await chargeUserForStoryboard(supabase, user.id);
    if (chargeError) {
      console.error('Failed to charge credits:', chargeError);
      return NextResponse.json(
        { error: 'Failed to process credits. Please try again.' },
        { status: 402 }
      );
    }

    return NextResponse.json({
      id: storyboardId,
      overview: storyboard.overview,
      beats: storyboard.beats,
      hookVariants: storyboard.hookVariants || [],
      generatedAt: new Date().toISOString(),
      // Pass through input insights for display/debugging
      inputInsights: {
        viralPatterns: input.viralPatterns || null,
        libraryInsights: input.libraryInsights || null,
      },
    });
  } catch (error) {
    console.error('Create storyboard error:', error);
    return NextResponse.json(
      { error: 'Failed to create storyboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getFormatGuidance(format: string): string {
  switch (format) {
    case 'talking_head':
      return `FORMAT DIRECTION (Talking Head):
- Lead with energy — the speaker IS the content. Confident posture, direct eye contact from frame 1.
- Vary framing between CU and MCU to maintain visual interest; avoid static medium shots for more than 10s.
- Build emotional connection: lean in for emphasis, use hand gestures, modulate vocal energy.
- Pace delivery in short bursts (1-2 sentences) then pause or shift energy to prevent monotony.
- Break up talking with B-roll inserts every 15-20s to give the viewer's eyes a rest.
- Match facial expression to content tone — excitement, concern, curiosity should be visible.`;
    case 'demo':
      return `FORMAT DIRECTION (Demo / Screen Recording):
- Open with the OUTCOME first — show what the finished result looks like before explaining how.
- Keep screen recordings readable: zoom into the active area, use cursor highlights, avoid full-desktop shots.
- Use zoom-in / focus transitions to guide the eye to exactly where the action is happening.
- Cut dead time ruthlessly — skip loading screens, typing pauses, and navigation. Every second should teach.
- Add text overlays for key steps and shortcuts so viewers can follow even on mute.
- Pace voiceover slightly ahead of on-screen action so the viewer knows what to look for next.`;
    case 'gameplay':
      return `FORMAT DIRECTION (Gameplay):
- Start with the most intense or impressive moment — hook with action, explain later.
- Identify 2-3 highlight moments per minute and build pacing around them.
- Keep cuts fast (2-4s per clip in montage sections) to match gaming energy.
- Time commentary to land between action beats — don't talk over clutch moments.
- If using facecam, keep it small and in a consistent corner; enlarge only for genuine reactions.
- Use slow-motion or replay for the single best moment — overuse kills impact.`;
    case 'b_roll':
      return `FORMAT DIRECTION (B-Roll / Cinematic):
- Tell the story through visuals alone — every shot must advance the narrative or set mood.
- Alternate between wide establishing shots and tight detail shots for rhythm.
- Let the music drive pacing: cut on beats, hold shots through phrases, breathe with the track.
- Use text overlays or captions as the narrative voice — keep them brief and let visuals do heavy lifting.
- Plan transitions intentionally: match motion direction, use natural wipes, avoid gratuitous effects.
- Every shot should answer "what does the viewer FEEL here?" not just "what do they see?"`;
    case 'vlog':
      return `FORMAT DIRECTION (Vlog):
- Prioritize authentic, unpolished feel — overly produced vlogs lose trust. Embrace natural moments.
- Vary locations and scenes frequently (every 20-30s) to maintain visual freshness.
- Keep a conversational, first-person tone — talk TO the viewer like a friend, not AT them.
- Use natural transitions: walking between locations, time-lapses, ambient scene changes.
- Build an energy arc across the video — start chill, build to the highlight, reflect at the end.
- Sprinkle in reaction moments and genuine emotion — these are the clips viewers remember.`;
    case 'tutorial':
      return `FORMAT DIRECTION (Tutorial / How-To):
- Structure as clear numbered steps — the viewer should always know where they are in the process.
- Use visual aids (arrows, highlights, split-screen before/after) to reinforce each instruction.
- Pace for comprehension: pause briefly after each step, don't rush to the next one.
- Add brief recap moments after complex sections — "so now we have X, next we'll do Y."
- Show the before/after transformation early to motivate viewers to watch the full tutorial.
- Keep energy calm but confident — tutorial viewers want clarity, not hype.`;
    default:
      return '';
  }
}

function createGenerationPrompt(input: CreateStoryboardInput): string {
  const keyPointsList = input.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n');

  // Build viral patterns section if available
  const viralPatternsSection = input.viralPatterns ? `

VIRAL PATTERNS ANALYSIS:
Based on analysis of ${input.viralPatterns.videosAnalyzed} recent viral videos in this niche (avg views: ${input.viralPatterns.averageViews.toLocaleString()}), incorporate these proven patterns:
${input.viralPatterns.videos && input.viralPatterns.videos.length > 0 ? `
Top Performing Videos (for reference):
${input.viralPatterns.videos.map((v, i) => `${i + 1}. "${v.title}" (${v.views.toLocaleString()} views)`).join('\n')}
` : ''}
Hook Patterns:
${input.viralPatterns.hookPatterns.map(p => `• ${p}`).join('\n')}

Content Structure Patterns:
${input.viralPatterns.structurePatterns.map(p => `• ${p}`).join('\n')}

Common Successful Elements:
${input.viralPatterns.commonElements.map(p => `• ${p}`).join('\n')}

IMPORTANT: Your storyboard should naturally incorporate these viral patterns. Priority goes to patterns from higher-view videos. Don't force them, but use them as a blueprint for success.
` : '';

  // Build library insights section if available
  const libraryInsightsSection = input.libraryInsights ? `

USER'S LIBRARY INSIGHTS (PRIORITIZE THIS):
Based on analysis of the user's own past videos, here's what has worked well for them:
${input.libraryInsights.recommendedHookStyle ? `• **Recommended Hook Style**: ${input.libraryInsights.recommendedHookStyle} - This style has performed well in their past content` : ''}
${input.libraryInsights.referenceVideoTitle ? `• **Reference Video**: "${input.libraryInsights.referenceVideoTitle}"` : ''}
${input.libraryInsights.referenceHookText ? `• **Successful Hook Example**: "${input.libraryInsights.referenceHookText}"` : ''}
${input.libraryInsights.insightSummary ? `• **Key Insight**: ${input.libraryInsights.insightSummary}` : ''}

CRITICAL: The user's own successful patterns should be the PRIMARY influence on this storyboard.
- If a hook style is recommended (e.g., "Authority", "Question"), make that style the DEFAULT Beat 1 hook
- Model the new hook after their successful reference hook if provided
- Adapt their proven patterns to this new topic
` : '';

  const hookDuration = Math.min(5, Math.floor(input.targetLength * 0.15));
  const hookVariantCount = getHookVariantCount(input);
  const hasViral = input.viralPatterns?.hookPatterns && input.viralPatterns.hookPatterns.length > 0;
  const hasLibrary = !!input.libraryInsights?.recommendedHookStyle;
  const defaultStyle = hasViral ? 'VIRAL' : hasLibrary ? 'LIBRARY' : 'BOLD';

  // Build hook styles list inline
  const hookStyles: string[] = [];
  let num = 1;
  if (hasViral) {
    hookStyles.push(`${num}. VIRAL (RECOMMENDED): Apply the top viral hook pattern: "${input.viralPatterns!.hookPatterns[0]}". Trending in this niche with avg ${input.viralPatterns!.averageViews.toLocaleString()} views.`);
    num++;
  }
  if (hasLibrary) {
    hookStyles.push(`${num}. LIBRARY: Use the "${input.libraryInsights!.recommendedHookStyle}" style from the user's past success.${input.libraryInsights!.referenceHookText ? ` Model after: "${input.libraryInsights!.referenceHookText}"` : ''}`);
    num++;
  }
  hookStyles.push(`${num}. BOLD: Confident claim or promise. Lead with the result. Assertive and direct.`);
  num++;
  hookStyles.push(`${num}. QUESTION: Thought-provoking question or curiosity gap. Make viewers NEED the answer.`);
  num++;
  hookStyles.push(`${num}. EMOTIONAL: Connect with the viewer's struggle or desire. Empathy, urgency, relatability.`);
  num++;
  hookStyles.push(`${num}. SPECIFIC: Concrete numbers, data, timeframes, or measurable outcomes.`);

  return `You are an expert video director creating a storyboard for short-form content.

VIDEO BRIEF:
- Topic: ${input.topic}
- Format: ${input.format}
- Length: ${input.targetLength}s
- Content Type: ${input.contentType || 'educational'}
- Audience: ${input.targetAudience || 'general audience'}

KEY POINTS:
${keyPointsList}

${getFormatGuidance(input.format)}
${viralPatternsSection}${libraryInsightsSection}
STRUCTURE: ${getBeatCount(input.targetLength, input.keyPoints.length)} beats total. Types: hook, setup, main_content, payoff, cta.

HOOK VARIANTS: Generate ${hookVariantCount} variants (0-${hookDuration}s each) in these styles:
${hookStyles.join('\n')}

Each variant needs: id (style name lowercase), style, label, script, visual, audio, directorNotes, whyItWorks (topic-specific, not generic). Every script must be COMPLETELY DIFFERENT — not word variations.

BEAT SCHEMA (every beat must include ALL fields):
- beatNumber (int), startTime (float), endTime (float), type (string)
- title (string), directorNotes (string), script (string), visual (string), audio (string)
- shotType: CU|MCU|MS|MLS|WS|OTS|POV|INSERT
- cameraMovement: static|pan|tilt|track|zoom|handheld|dolly
- transition: cut|dissolve|fade|zoom|swipe|whip|none
- textOverlays: [{text, position: top|center|bottom|lower-third, timing}]
- bRollSuggestions: [string, string] (2-3 ideas)
- retentionTip: string

DIRECTOR NOTES GUIDELINES:
- Start with action verbs (Start, Show, Cut, Maintain, etc.)
- Be specific about camera angles, pacing, energy, delivery
- Format as bullet points: "• First instruction\\n• Second instruction"
- 3-5 points per beat
- Wrap the 1-2 MOST IMPORTANT notes in **double asterisks**

VISUAL GUIDELINES:
- 2-3 concise bullet points, each under 10 words
- Format: "• Camera angle/shot type\\n• Key visual element\\n• Context/setting"

AUDIO GUIDELINES:
- 1-2 concise bullet points, each under 8 words
- Format: "• Music description\\n• Sound effect (if needed)"

TIMING:
- Hook: 0-${hookDuration}s | Setup: 20-25% | Main: 50-60% | Payoff: 10-15% | CTA: last 3-5s

RESPONSE FORMAT: Return ONLY a JSON object with keys: overview {title, contentType, nicheCategory, targetAudience, length}, hookVariants [...], beats [...].
Beat 1 script must use the ${defaultStyle} hook variant as default.
${input.locale && input.locale !== 'en' ? `ALL text content must be written in ${getLanguageName(input.locale)}.` : ''}
NO markdown code blocks. Return ONLY the JSON object.`;
}

function getBeatCount(length: number, keyPointsCount: number): number {
  if (length <= 30) {
    return Math.min(3, keyPointsCount + 2);
  } else if (length <= 60) {
    return keyPointsCount + 2;
  } else {
    return keyPointsCount + 3;
  }
}

function getHookVariantCount(input: CreateStoryboardInput): number {
  let count = 4; // Base: bold, question, emotional, specific
  if (input.libraryInsights?.recommendedHookStyle) count++;
  if (input.viralPatterns?.hookPatterns?.length) count++;
  return count;
}
