import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { GoogleGenAI } from '@google/genai';

export interface ThumbnailScore {
  overall: number;
  visualClarity: number;
  textImpact: number;
  emotionalHook: number;
  ctrPotential: number;
}

export interface ThumbnailImprovement {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

export interface ThumbnailAnalysis {
  scores: ThumbnailScore;
  strengths: string[];
  improvements: ThumbnailImprovement[];
  overallFeedback: string;
}

/**
 * Fetch a YouTube thumbnail, trying maxresdefault then hqdefault.
 * Returns base64-encoded JPEG image data.
 */
async function fetchThumbnailBase64(videoId: string): Promise<{ data: string; mimeType: string }> {
  const urls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const buffer = await res.arrayBuffer();
      // YouTube returns a 120x90 placeholder for missing thumbnails — skip those
      if (buffer.byteLength < 5000) continue;

      const base64 = Buffer.from(buffer).toString('base64');
      return { data: base64, mimeType: 'image/jpeg' };
    } catch {
      continue;
    }
  }

  throw new Error('Could not fetch thumbnail for this video');
}

const THUMBNAIL_PROMPT = `You are an expert YouTube thumbnail analyst specializing in click-through rate (CTR) optimization for short-form video (Shorts/Reels/TikTok).

Analyze this thumbnail and return ONLY a JSON object with this exact structure:

{
  "scores": {
    "overall": <0-100>,
    "visualClarity": <0-100>,
    "textImpact": <0-100>,
    "emotionalHook": <0-100>,
    "ctrPotential": <0-100>
  },
  "strengths": [
    "<specific strength observed in this thumbnail>",
    "<another strength>"
  ],
  "improvements": [
    {
      "priority": "high",
      "title": "<short improvement title>",
      "description": "<specific, actionable suggestion for this thumbnail>"
    }
  ],
  "overallFeedback": "<2-3 sentences of direct, specific feedback about this thumbnail's CTR potential and biggest opportunity>"
}

Scoring guide:
- visualClarity: Is the subject immediately obvious? Is there clutter? Is it readable at small size?
- textImpact: If text is present, is it bold/readable/compelling? If no text, score 50 (neutral, since text is optional but often helps).
- emotionalHook: Does it trigger curiosity, excitement, shock, or desire to click?
- ctrPotential: Overall likelihood a viewer scrolling their feed would stop and click.
- overall: Weighted average (ctrPotential × 0.4 + emotionalHook × 0.3 + visualClarity × 0.2 + textImpact × 0.1)

Improvements: List 2-4 improvements ordered by priority (high → medium → low).
Strengths: List 2-3 specific strengths visible in THIS thumbnail.

IMPORTANT: Return ONLY the JSON. No markdown, no commentary.`;

/**
 * POST /api/analyze-thumbnail
 * Body: { videoId: string }
 * Returns: ThumbnailAnalysis
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { videoId } = body as { videoId?: string };

    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Valid YouTube video ID is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Fetch thumbnail
    const { data: imageData, mimeType } = await fetchThumbnailBase64(videoId);

    // Analyze with Gemini
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: THUMBNAIL_PROMPT },
            { inlineData: { mimeType, data: imageData } },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: 'No analysis returned from Gemini' }, { status: 500 });
    }

    // Strip markdown code fences if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const analysis: ThumbnailAnalysis = JSON.parse(jsonText);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('[analyze-thumbnail] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message.includes('thumbnail') ? message : `Thumbnail analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
