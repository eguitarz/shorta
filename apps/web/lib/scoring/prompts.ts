/**
 * LLM Prompts for Deterministic Scoring System
 *
 * Two-stage process:
 * 1. Signal extraction - Get measurable data from video
 * 2. Analysis generation - Explain scores and provide suggestions
 */

import type { VideoSignals, SubScores, ScoreBreakdown } from './types';

// ============================================
// Signal Extraction Prompt
// ============================================

export const SIGNAL_EXTRACTION_PROMPT = `You are a VIDEO SIGNAL EXTRACTOR. Your job is to extract MEASURABLE SIGNALS from the video.

IMPORTANT: Do NOT provide scores or opinions. Extract ONLY factual measurements.

First, identify the VIDEO FORMAT:
- **Talking Head**: Person speaking directly to camera
- **Gameplay**: Gaming content with or without commentary
- **Faceless/Other**: Screen recordings, B-roll montages, text-based, no visible speaker

Return ONLY valid JSON in this exact format:

{
  "format": "<talking_head|gameplay|other>",
  "signals": {
    "hook": {
      "TTClaim": <number - seconds until first hook moment. See format-specific guidelines below>,
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
- TTClaim: Seconds until speaker makes a promise/claim ("I'll show you...", "Here's the secret...")
- pauseCount: Count deliberate pauses for effect
- fillerCount: Count "um", "uh", "like", "you know"
- EC: Voice energy variation

**GAMEPLAY:**
- TTClaim: Seconds until first exciting/interesting moment (action, kill, reveal, fail)
- pauseCount: Use 2 (neutral) - pauses less relevant
- fillerCount: Count if commentary exists, otherwise 0
- EC: Action intensity variation (not just voice)
- PP: True if there's a climax, win, or satisfying conclusion

**FACELESS/OTHER (screen recordings, B-roll, text-based):**
- TTClaim: Seconds until first value is shown (key info, interesting visual, text hook)
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
  beatTimestamps: any[]
): string {
  // Format violations for context
  const violationsContext =
    violations.length > 0
      ? `\n\nLINT VIOLATIONS DETECTED:\n${violations
          .map(
            (v, idx) =>
              `${idx + 1}. [${v.severity.toUpperCase()}] ${v.ruleName} (${v.ruleId})
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
    "hookCategory": "string - MUST be one of: 'Outcome-first', 'Relatable pain', 'Contradiction / Myth-busting', 'Shock / Bold claim', 'Curiosity gap', 'Authority / Credibility', 'Specific number / specificity', 'Direct call-out', 'Pattern interrupt (verbal)', 'Before / After contrast', 'Time-bound promise', 'Negative framing', 'Question hook', 'Other'",
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
    "directorAssessment": "string - Professional director's review explaining the scores. Reference specific moments and signals. Format with newlines.",
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

LANGUAGE ALIGNMENT - CRITICAL:
- ALL output text must be in the SAME language as the video/transcript
- Do NOT mix languages

Return ONLY the JSON. No additional text.`;
}
