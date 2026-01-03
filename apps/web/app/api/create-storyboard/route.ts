import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { requireAuth } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

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
}

export async function POST(request: NextRequest) {
  // Require authentication for this API route
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
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

    return NextResponse.json({
      overview: storyboard.overview,
      beats: storyboard.beats,
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
- Hook: 0-${Math.min(5, Math.floor(input.targetLength * 0.15))}s (grab attention immediately)
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
  "beats": [
    {
      "beatNumber": 1,
      "startTime": 0,
      "endTime": 5,
      "type": "hook",
      "title": "Hook - [Descriptive Title]",
      "directorNotes": "• First actionable instruction\\n• Second instruction\\n• Third instruction",
      "script": "What to say in this beat",
      "visual": "• Medium close-up\\n• Natural setting\\n• Direct eye contact",
      "audio": "• Upbeat acoustic music\\n• Subtle whoosh effect"
    }
  ]
}

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
