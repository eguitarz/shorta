import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { VideoLinter } from '@/lib/linter';
import type { VideoFormat } from '@/lib/linter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/;
    const isYouTube = youtubeRegex.test(url);

    if (!isYouTube) {
      return NextResponse.json(
        { error: 'Only YouTube URLs are supported for storyboard analysis' },
        { status: 400 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    if (!client.classifyVideo || !client.analyzeVideo) {
      return NextResponse.json(
        { error: 'Client does not support video analysis' },
        { status: 500 }
      );
    }

    // Step 1: Classify the video format
    let classification;
    try {
      classification = await client.classifyVideo(url);
      console.log('Classification result:', JSON.stringify(classification, null, 2));

      if (!classification || !classification.format) {
        throw new Error('Invalid classification result');
      }
    } catch (error) {
      console.error('Classification error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to classify video format' },
        { status: 500 }
      );
    }

    // Step 2: Run linter based on format
    const linter = new VideoLinter(client);
    let lintResult;
    try {
      lintResult = await linter.lint(url, classification.format as VideoFormat);
    } catch (error) {
      console.error('Linting error:', error);
      return NextResponse.json(
        { error: 'Failed to lint video' },
        { status: 500 }
      );
    }

    // Step 3: Generate storyboard with lint violations embedded
    const storyboardPrompt = buildStoryboardPrompt(lintResult.violations);

    let storyboardResponse;
    try {
      storyboardResponse = await client.analyzeVideo(url, storyboardPrompt, {
        temperature: 0.3, // Lower temperature for more consistent JSON
        maxTokens: 8192,
      });
    } catch (error) {
      console.error('Storyboard analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to generate storyboard analysis' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let storyboard;
    try {
      let jsonText = storyboardResponse.content.trim();

      // Handle markdown code blocks
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      storyboard = JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse storyboard JSON:', storyboardResponse.content);
      return NextResponse.json(
        { error: 'Failed to parse storyboard analysis' },
        { status: 500 }
      );
    }

    const response = {
      url,
      classification: {
        format: classification?.format || 'unknown',
        confidence: classification?.confidence || 0,
        evidence: classification?.evidence || [],
        fallback: classification?.fallback || {
          format: 'other',
          confidence: 0,
        },
      },
      lintSummary: {
        totalRules: lintResult?.totalRules || 0,
        score: lintResult?.score || 0,
        passed: lintResult?.passed || 0,
        warnings: lintResult?.warnings || 0,
        errors: lintResult?.errors || 0,
      },
      storyboard,
    };

    console.log('Final response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analyze storyboard API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

function buildStoryboardPrompt(violations: any[]) {
  // Format violations for context
  const violationsContext = violations.length > 0
    ? `\n\nLINT VIOLATIONS DETECTED:\n${violations.map((v, idx) =>
        `${idx + 1}. [${v.severity.toUpperCase()}] ${v.ruleName} (${v.ruleId})
   Timestamp: ${v.timestamp || 'N/A'}
   Message: ${v.message}
   Suggestion: ${v.suggestion || 'N/A'}`
      ).join('\n\n')}`
    : '';

  return `You are an expert YouTube Shorts director. Analyze the provided YouTube Short and generate a structured JSON storyboard.

${violationsContext}

Your task is to:
1. Break down the video into natural beats/sections (3-7 beats depending on length)
2. For each beat, map any lint violations that occur during that timestamp range
3. Provide detailed analysis in a structured JSON format

Return ONLY valid JSON in this exact format:

{
  "overview": {
    "title": "string - video title if detectable",
    "length": number - total duration in seconds,
    "hookPattern": "string - e.g., 'Confession + Specific Outcome', 'Shocking Statistic'",
    "contentType": "string - e.g., 'Talking head', 'Screen recording', 'B-roll montage'",
    "targetAudience": "string - inferred audience"
  },
  "beats": [
    {
      "beatNumber": number,
      "startTime": number - in seconds,
      "endTime": number - in seconds,
      "type": "string - e.g., 'HOOK', 'CONTEXT', 'BUILDUP', 'PAYOFF', 'CTA'",
      "title": "string - descriptive beat name",
      "transcript": "string - exact words spoken",
      "visual": "string - detailed shot description: camera angle, framing, movement, lighting",
      "audio": "string - vocal delivery, tone, pacing, background audio, sound effects",
      "retention": {
        "level": "string - 'minimal_drop', 'moderate_drop', 'high_drop', or 'critical_drop'",
        "analysis": "string - why this retention level, what keeps viewers or causes them to leave",
        "issues": [
          {
            "severity": "string - 'error', 'warning', or 'info'",
            "message": "string - what the issue is",
            "suggestion": "string - specific actionable fix"
          }
        ]
      }
    }
  ],
  "performance": {
    "score": number - 0-10 overall score,
    "hookStrength": number - 0-4 score,
    "structurePacing": number - 0-3 score,
    "deliveryPerformance": number - 0-3 score,
    "retentionDrivers": ["string - key element 1", "string - key element 2", "..."],
    "pacingStrategy": "string - how video maintains momentum",
    "visualEngagementTactics": "string - text overlays, cuts, B-roll, etc."
  },
  "replicationBlueprint": {
    "elementsToKeep": ["string - universal technique 1", "..."],
    "elementsToAdapt": ["string - customizable element 1", "..."],
    "mistakesToAvoid": ["string - pitfall 1", "..."],
    "patternVariations": ["string - different niche application 1", "..."]
  }
}

CRITICAL INSTRUCTIONS:
1. Map each lint violation to the appropriate beat based on timestamp
2. Include the violation in that beat's retention.issues array
3. Ensure retention.level accurately reflects the severity of issues found
4. Be specific with timestamps - use actual seconds from the video
5. Return ONLY the JSON object, no additional text or explanation
6. Ensure all JSON is properly formatted and escaped

Now analyze the video and generate the complete storyboard JSON.`;
}
