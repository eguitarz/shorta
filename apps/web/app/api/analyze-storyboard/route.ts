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
      const errorMessage = error instanceof Error ? error.message : 'Failed to classify video format';
      return NextResponse.json(
        { error: `Classification failed: ${errorMessage}` },
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to lint video';
      return NextResponse.json(
        { error: `Linting failed: ${errorMessage}` },
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate storyboard analysis';
      return NextResponse.json(
        { error: `Storyboard generation failed: ${errorMessage}` },
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
        moderate: lintResult?.moderate || 0,
        critical: lintResult?.critical || 0,
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
      "visual": "string - what makes this shot work (or what's missing). Focus on key techniques: cuts, zooms, text overlays, B-roll. Keep it simple.",
      "audio": "string - what makes the delivery engaging (or what's off). Focus on: energy level, pacing changes, music/SFX impact. Keep it simple.",
      "retention": {
        "level": "string - 'minimal_drop', 'moderate_drop', 'high_drop', or 'critical_drop'",
        "analysis": "string - why this retention level, what keeps viewers or causes them to leave",
        "issues": [
          {
            "severity": "string - 'critical', 'moderate', or 'minor'",
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
    "directorAssessment": "string - 2-3 sentence director's perspective on current performance and viral potential. Use filmmaker language. Assess what's working, what's holding it back, and realistic viral potential. Wrap key terms in **double asterisks** (e.g., 'Solid fundamentals but **weak hook** limits viral ceiling to **50K views**', '**Strong retention mechanics** with **high viral potential** - could hit **500K+** with right promotion')",
    "retentionDrivers": ["string - key element 1", "string - key element 2", "..."],
    "pacingStrategy": "string - how video maintains momentum",
    "visualEngagementTactics": "string - text overlays, cuts, B-roll, etc.",
    "hook": {
      "duration": number - seconds of hook (0-5),
      "viralPattern": number - 0-100 how well it matches viral patterns,
      "loopStrength": number - 0-100 re-watch potential,
      "analysis": "string - 2-3 bullet points with actionable insights. Wrap important terms in **double asterisks** for emphasis (e.g., 'Opens with **strong hook** at **0:02s**', 'Increase **loop potential** by **15%**')"
    },
    "structure": {
      "videoLength": number - total seconds,
      "pacingConsistency": number - 0-100 how consistent the pacing is,
      "payoffTiming": number - 0-100 how well-timed the payoff is,
      "analysis": "string - 2-3 bullet points with actionable insights. Wrap important terms in **double asterisks** for emphasis (e.g., '**Well-paced** throughout with **consistent** energy', 'Add **payoff** at **0:35s**')"
    },
    "content": {
      "contentType": "string - Educational/Entertainment/Tutorial/Story/etc",
      "valueClarity": number - 0-100 how clear the value proposition is,
      "uniqueness": number - 0-100 how unique the angle/perspective is,
      "analysis": "string - 2-3 bullet points with actionable insights. Wrap important terms in **double asterisks** for emphasis (e.g., '**High value** proposition is **clear** from start', 'Improve **uniqueness** with different angle')"
    },
    "delivery": {
      "energyLevel": number - 0-100 vocal energy and enthusiasm,
      "vocalClarity": number - 0-100 how clear and understandable speech is,
      "presence": number - 0-100 camera presence and charisma,
      "analysis": "string - 2-3 bullet points with actionable insights. Wrap important terms in **double asterisks** for emphasis (e.g., '**Excellent energy** at **85%**', 'Increase **vocal clarity** in middle section')"
    }
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
7. FORMAT ANALYSIS AS BULLET POINTS: In the hook, structure, content, and delivery analysis fields, use newlines (\\n) to separate each bullet point. Start each line with the content directly (no bullet character needed). Example: "Strong hook opens at 0:02s\\nViral pattern matches proven format\\nIncrease loop potential by adding callback"

VISUAL & AUDIO ANALYSIS - Director's Perspective:
- Don't just describe what you see/hear - explain what WORKS or what's MISSING
- Focus on techniques that drive engagement: quick cuts, zooms, text overlays, energy shifts, music drops
- Keep it simple and actionable - what would you tell the creator to replicate or fix?
- Example GOOD visual: "Fast cuts every 2-3s + punch-in zoom on key words keeps eyes moving"
- Example BAD visual: "Medium close-up shot with the subject centered in frame under soft lighting"
- Example GOOD audio: "High energy delivery with strategic pauses before big reveals"
- Example BAD audio: "The speaker uses a conversational tone with moderate pacing and background music"

Now analyze the video and generate the complete storyboard JSON.`;
}
