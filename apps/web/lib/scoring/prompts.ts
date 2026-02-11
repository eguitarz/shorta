/**
 * LLM Prompts for Deterministic Scoring System
 *
 * Two-stage process:
 * 1. Signal extraction - Get measurable data from video
 * 2. Analysis generation - Explain scores and provide suggestions
 */

import type { VideoSignals, SubScores, ScoreBreakdown } from './types';
import { HOOK_TYPE_VALUES } from './hook-types';
import { getLanguageName } from '../i18n-helpers';

// ============================================
// Signal Extraction Prompt
// ============================================

export const SIGNAL_EXTRACTION_PROMPT = `You are a VIDEO SIGNAL EXTRACTOR. Your job is to extract MEASURABLE SIGNALS from the video.

IMPORTANT: Do NOT provide scores or opinions. Extract ONLY factual measurements.

First, identify the VIDEO FORMAT:
- **Talking Head**: Person speaking directly to camera
- **Gameplay**: Gaming content with or without commentary
- **Demo**: Screen recordings, product demos, software walkthroughs, tool tutorials — primary visual is a screen/UI/product
- **Faceless/Other**: B-roll montages, text-based, animations, lifestyle — no visible speaker and not a demo

Return ONLY valid JSON in this exact format:

{
  "format": "<talking_head|gameplay|demo|other>",
  "signals": {
    "hook": {
      "TTClaim": <number - seconds until first VALUE SIGNAL to viewer. See detailed guidelines below>,
      "PB": <number 1-5 - pattern break / energy variation in first 1-3 seconds. 1=no variation (flat start), 3=moderate energy, 5=very strong pattern interrupt (sudden zoom, energy spike, unexpected element)>,
      "Spec": <number - count of SPECIFIC elements in the hook (first 3-5 seconds): numbers ("7 days", "$500"), timeframes ("in 2024"), costs, percentages, proper nouns (brand names, tool names). Count each specific element>,
      "QC": <number - count of questions or contradictions in hook. Questions: "Why does X?", "What if?". Contradictions: "You think X? Wrong.", "Most people do X, but...". Count each occurrence>
    },
    "structure": {
      "BC": <number - total distinct beat/section count in entire video. A beat is a coherent section with one purpose (HOOK, CONTEXT, BUILDUP, PAYOFF, CTA). Typically 3-7 for shorts>,
      "PM": <number - count of progress markers throughout video. Examples: "first", "second", "next", "then", "finally", "step 1", "here's the plan", "last thing". Count each marker>,
      "PP": <boolean - true if there is a clear payoff, answer, or resolution in the last 15-20% of the video. The promise made in the hook should be fulfilled>,
      "LC": <boolean - true if the ending references the beginning OR creates a loop that encourages rewatching. Examples: callback to opening line, "remember when I said X?", "if you want part 2...">
    },
    "clarity": {
      "wordCount": <number - total word count in the entire transcript. For faceless/gameplay without speech, count text overlay words>,
      "duration": <number - video duration in seconds>,
      "SC": <number 1-5 - sentence/content complexity. 1=very simple, 3=moderate, 5=very complex>,
      "TJ": <number - count of topic/scene jumps or sudden context switches>,
      "RD": <number 1-5 - redundancy level. 1=concise, 3=some repetition, 5=very repetitive>
    },
    "delivery": {
      "LS": <number 1-5 - audio consistency. 1=very inconsistent, 3=some variation, 5=very consistent>,
      "NS": <number 1-5 - audio quality. 1=poor (noise, distortion), 3=acceptable, 5=studio quality>,
      "pauseCount": <number - count of deliberate pauses. For non-speech: use 2 as neutral>,
      "fillerCount": <number - count of filler words. For non-speech: use 0>,
      "EC": <boolean - true if there is noticeable energy/intensity variation throughout>
    }
  },
  "transcript": "<full transcript OR text overlay content if no speech>",
  "beatTimestamps": [
    {
      "beatNumber": 1,
      "startTime": 0,
      "endTime": <seconds>,
      "type": "<HOOK|CONTEXT|BUILDUP|PAYOFF|CTA>"
    }
  ]
}

=== FORMAT-SPECIFIC GUIDELINES ===

**TALKING HEAD:**
- TTClaim: Seconds until speaker gives viewer a REASON TO KEEP WATCHING.

  COUNT AS VALUE SIGNAL (start timer here):
  • Explicit promise: Speaker says they will show/teach/reveal something
  • Emotional intensity: Words expressing strong reaction (amazed, shocked, changed everything, game-changer, mind-blown, unbelievable, secret)
  • Direct viewer benefit: Addresses what viewer will gain or avoid
  • Curiosity trigger: Creates information gap viewer wants filled

  DO NOT COUNT (keep waiting):
  • Self-referential setup: Speaker describes their own action/experience without signaling viewer value
  • Neutral context: Background information, introductions, greetings
  • Brand/product mentions alone: Naming something is not a value signal

  EXAMPLE: "I just discovered a new tool from X. It completely changed how I work."
  → "I just discovered a new tool from X" = setup (no value signal yet)
  → "completely changed how I work" = VALUE SIGNAL (emotional intensity + implied benefit)
  → TTClaim = timestamp of "completely changed"

- pauseCount: Count deliberate pauses for effect
- fillerCount: Count filler sounds/words (hesitation sounds, verbal fillers)
- EC: Voice energy variation

**GAMEPLAY:**
- TTClaim: Seconds until first exciting/interesting moment (action, kill, reveal, fail)
- pauseCount: Use 2 (neutral) - pauses less relevant
- fillerCount: Count if commentary exists, otherwise 0
- EC: Action intensity variation (not just voice)
- PP: True if there's a climax, win, or satisfying conclusion

**DEMO (screen recordings, product demos, software walkthroughs, tutorials):**
- TTClaim: Seconds until first VALUE SIGNAL. For demos, this is typically when the outcome/result is first shown OR when the viewer understands what they will learn. Setup actions (opening apps, navigating menus) do NOT count. The result preview or clear promise counts.
- PB: Rate based on visual impact of the opening. Showing a finished result = 4-5. Starting with a raw app/browser = 1-2.
- Spec: Count specific elements: tool names, version numbers, time savings ("in 10 seconds"), metrics, specific features
- pauseCount: Count deliberate pauses in voiceover. If no voiceover, use 2 (neutral)
- fillerCount: Count fillers in voiceover. If no voiceover, use 0
- wordCount: Count voiceover words + text overlay words
- EC: Visual/audio intensity variation (zooms, transitions, music changes, speed ramps)
- PP: True if the promised demo result is clearly shown (the tool working, the output generated, the feature in action)
- SC: Rate complexity of the explanation. Simple step-by-step = 1-2. Technical deep-dive = 4-5.
- TJ: Count jumps between unrelated features or tools. A linear walkthrough = 0. Jumping between apps = 2+.

**FACELESS/OTHER (B-roll montages, text-based, animations, lifestyle):**
- TTClaim: Seconds until first VALUE SIGNAL appears (text hook with promise/emotion, key reveal, surprising visual)
- pauseCount: Use 2 (neutral)
- fillerCount: 0 (no speech)
- wordCount: Count text overlay words if no voiceover
- EC: Visual/audio intensity variation (cuts, music, pacing)
- PP: True if the promised value is delivered

=== UNIVERSAL GUIDELINES ===

**PB (Pattern Break):**
- 1 = Static start, no energy change, typical "Hey guys" opening
- 3 = Some energy, minor visual/audio interest
- 5 = Immediate high energy, unexpected element, visual punch, dramatic pause

**Spec (Specificity):**
- Count: numbers, percentages, dollar amounts, time periods, brand/tool names, dates
- "I made $10,000 in 30 days using ChatGPT" = 3 specifics
- "I made money quickly using AI" = 0 specifics (too vague)
- For gameplay: count specific game names, scores, achievements
- For faceless: count specific numbers/names in text overlays

**Beat Types:**
- HOOK: Opening 1-5 seconds that grabs attention
- CONTEXT: Background info, setup, "here's why this matters"
- BUILDUP: Tension, anticipation, "here's what most people do wrong"
- PAYOFF: The answer, revelation, main value delivery, climax
- CTA: Call to action, "follow for more", "try this"

LANGUAGE ALIGNMENT - CRITICAL:
- Detect the primary language spoken/shown in the video
- The transcript MUST be in the SAME language as the video
- Do NOT translate or mix languages

Return ONLY the JSON. No additional text, no markdown code blocks.`;

// ============================================
// Analysis Prompt Builder
// ============================================

export function buildAnalysisPrompt(
  violations: any[],
  signals: VideoSignals,
  scores: { subScores: SubScores; totalScore: number; breakdown: ScoreBreakdown },
  transcript: string,
  beatTimestamps: any[],
  locale?: string
): string {
  // Format violations for context
  const violationsContext =
    violations.length > 0
      ? `\n\nLINT VIOLATIONS DETECTED:\n${violations
        .map(
          (v, idx) =>
            `${idx + 1}. [${v.severity.toUpperCase()}] ${v.ruleName}
   Timestamp: ${v.timestamp || 'N/A'}
   Message: ${v.message}
   Suggestion: ${v.suggestion || 'N/A'}`
        )
        .join('\n\n')}`
      : '';

  // Format calculated scores
  const scoresContext = `
CALCULATED SCORES (Deterministic - DO NOT change these):
- Hook Score: ${scores.subScores.hook}/100
  - Time to Claim: ${scores.breakdown.hook.TTClaim}/100
  - Pattern Break: ${scores.breakdown.hook.PB}/100
  - Specificity: ${scores.breakdown.hook.Spec}/100
  - Question/Contradiction: ${scores.breakdown.hook.QC}/100

- Structure Score: ${scores.subScores.structure}/100
  - Beat Count: ${scores.breakdown.structure.BC}/100
  - Progress Markers: ${scores.breakdown.structure.PM}/100
  - Payoff Presence: ${scores.breakdown.structure.PP}/100
  - Loop Cue: ${scores.breakdown.structure.LC}/100

- Clarity Score: ${scores.subScores.clarity}/100
  - Words Per Second: ${scores.breakdown.clarity.WPS}/100
  - Sentence Complexity: ${scores.breakdown.clarity.SC}/100
  - Topic Jumps: ${scores.breakdown.clarity.TJ}/100
  - Redundancy: ${scores.breakdown.clarity.RD}/100

- Delivery Score: ${scores.subScores.delivery}/100
  - Loudness Stability: ${scores.breakdown.delivery.LS}/100
  - Audio Quality: ${scores.breakdown.delivery.NS}/100
  - Pause Quality: ${scores.breakdown.delivery.PQ}/100
  - Energy Curve: ${scores.breakdown.delivery.EC}/100

- TOTAL SCORE: ${scores.totalScore}/100`;

  // Format signals
  const signalsContext = `
EXTRACTED SIGNALS:
- Hook: TTClaim=${signals.hook.TTClaim}s, PB=${signals.hook.PB}/5, Spec=${signals.hook.Spec}, QC=${signals.hook.QC}
- Structure: BC=${signals.structure.BC} beats, PM=${signals.structure.PM}, PP=${signals.structure.PP}, LC=${signals.structure.LC}
- Clarity: ${signals.clarity.wordCount} words / ${signals.clarity.duration}s = ${(signals.clarity.wordCount / signals.clarity.duration).toFixed(1)} WPS, SC=${signals.clarity.SC}/5, TJ=${signals.clarity.TJ}, RD=${signals.clarity.RD}/5
- Delivery: LS=${signals.delivery.LS}/5, NS=${signals.delivery.NS}/5, pauses=${signals.delivery.pauseCount}, fillers=${signals.delivery.fillerCount}, EC=${signals.delivery.EC}`;

  return `You are an expert YouTube Shorts director. Analyze the provided video and generate a structured JSON storyboard.

${locale && locale !== 'en' ? `CRITICAL LANGUAGE REQUIREMENT: ALL output (analysis, explanations, suggestions, director's assessment, visual/audio descriptions, beat titles) MUST be written in ${getLanguageName(locale)}. DO NOT use English for these fields.` : ''}

${violationsContext}

${scoresContext}

${signalsContext}

TRANSCRIPT:
${transcript}

BEAT TIMESTAMPS:
${JSON.stringify(beatTimestamps, null, 2)}

Your task is to:
1. Generate beat-by-beat analysis using the provided beat timestamps
2. For each beat, map any lint violations that occur during that timestamp range
3. EXPLAIN why the scores are what they are (reference the signals and specific moments)
4. Provide actionable suggestions based on the scores

IMPORTANT: The performance scores (hookStrength, structurePacing, deliveryPerformance, content.valueClarity) have ALREADY been calculated. Your job is to:
- Use the EXACT calculated scores provided above
- Explain WHY each score is what it is
- Provide suggestions for improvement

Return ONLY valid JSON in this exact format:

{
  "overview": {
    "title": "string - video title if detectable",
    "length": ${signals.clarity.duration},
    "hookCategory": "string - MUST be one of: ${HOOK_TYPE_VALUES.map(t => `'${t}'`).join(', ')}",
    "hookPattern": "string - specific description of the hook approach used",
    "nicheCategory": "string - MUST be one of: 'Creator / Personal Brand', 'Business / Career', 'Tech / AI', 'Productivity / Mindset', 'Money / Growth', 'Marketing / Growth', 'Education / Explainer', 'Life / Psychology', 'Design / Creative', 'Other'",
    "nicheDescription": "string - specific subcategory",
    "contentType": "string - e.g., 'Talking head', 'Screen recording', 'B-roll montage'",
    "targetAudience": "string - inferred audience"
  },
  "beats": [
    {
      "beatNumber": number,
      "startTime": number,
      "endTime": number,
      "type": "string - HOOK|CONTEXT|BUILDUP|PAYOFF|CTA",
      "title": "string - descriptive beat name",
      "transcript": "string - exact words spoken in this beat",
      "visual": "string - what makes this work visually (cuts, zooms, text overlays)",
      "audio": "string - what makes the delivery engaging (energy, pacing, music)",
      "retention": {
        "level": "string - 'minimal_drop', 'moderate_drop', 'high_drop', or 'critical_drop'",
        "analysis": "string - why this retention level",
        "issues": [
          {
            "severity": "critical|moderate|minor",
            "message": "string - what the issue is",
            "suggestion": "string - specific actionable fix",
            "ruleId": "string - OPTIONAL, only if from lint violation",
            "ruleName": "string - OPTIONAL, only if from lint violation"
          }
        ]
      }
    }
  ],
  "performance": {
    "score": ${Math.round(scores.totalScore / 10)},
    "hookStrength": ${scores.subScores.hook},
    "structurePacing": ${scores.subScores.structure},
    "deliveryPerformance": ${scores.subScores.delivery},
    "directorAssessment": "string - Professional director's review explaining the scores. Start with a one-line diagnosis, then use bullet points (•) for specific observations. Reference specific moments and signals. Example format:\nThis video struggles with retention due to weak hook execution.\n• Hook lacks pattern interrupt - opens with generic greeting\n• Strong payoff at 0:45 but buried too late\n• Delivery energy drops mid-video",
    "retentionDrivers": ["string - key engagement element 1", "..."],
    "pacingStrategy": "string - how video maintains momentum",
    "visualEngagementTactics": "string - text overlays, cuts, B-roll, etc.",
    "hook": {
      "duration": ${beatTimestamps[0]?.endTime || 3},
      "viralPattern": number 0-100,
      "loopStrength": number 0-100,
      "analysis": "string - EXPLAIN why hook scored ${scores.subScores.hook}/100. Reference TTClaim (${signals.hook.TTClaim}s), specifics (${signals.hook.Spec}), pattern break, etc."
    },
    "structure": {
      "videoLength": ${signals.clarity.duration},
      "pacingConsistency": number 0-100,
      "payoffTiming": number 0-100,
      "analysis": "string - EXPLAIN why structure scored ${scores.subScores.structure}/100. Reference beat count (${signals.structure.BC}), progress markers (${signals.structure.PM}), payoff presence."
    },
    "content": {
      "contentType": "string",
      "valueClarity": ${scores.subScores.clarity},
      "uniqueness": number 0-100,
      "analysis": "string - EXPLAIN why clarity scored ${scores.subScores.clarity}/100. Reference WPS (${(signals.clarity.wordCount / signals.clarity.duration).toFixed(1)}), complexity, topic jumps."
    },
    "delivery": {
      "energyLevel": number 0-100,
      "vocalClarity": number 0-100,
      "presence": number 0-100,
      "analysis": "string - EXPLAIN why delivery scored ${scores.subScores.delivery}/100. Reference audio quality (${signals.delivery.NS}/5), fillers (${signals.delivery.fillerCount}), energy variation."
    }
  },
  "replicationBlueprint": {
    "elementsToKeep": ["string - technique to replicate"],
    "elementsToAdapt": ["string - customizable element"],
    "mistakesToAvoid": ["string - pitfall based on low scores"],
    "patternVariations": ["string - niche application"]
  }
}

CRITICAL INSTRUCTIONS:
1. Use the EXACT scores provided above for hookStrength, structurePacing, deliveryPerformance, and content.valueClarity
2. Your analysis should EXPLAIN the scores, not determine them
3. Reference specific moments, timestamps, and signal values in your explanations
4. Suggestions should directly address the lowest-scoring components
5. Map lint violations to appropriate beats based on timestamp
6. For AI-discovered issues, OMIT ruleId and ruleName fields
7. NEVER include technical rule IDs (like th_hook_energy, gen_hook_clear_promise, etc.) in analysis text - use only human-readable descriptions

LANGUAGE ALIGNMENT - CRITICAL:
${locale && locale !== 'en'
      ? `- Write ALL analysis, suggestions, and explanations in ${getLanguageName(locale)}
- Keep the transcript field in its ORIGINAL language (same as video)
- Beat titles and visual/audio descriptions should be in ${getLanguageName(locale)}`
      : `- ALL output text must be in the SAME language as the video/transcript
- Do NOT mix languages`}

Return ONLY the JSON. No additional text.`;
}
