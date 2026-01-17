import { createServiceClient } from '@/lib/supabase-service';
import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import {
  calculateDeterministicScores,
  SIGNAL_EXTRACTION_PROMPT,
  buildAnalysisPrompt,
  type VideoSignals,
  type SignalExtractionResult,
  type VideoFormat,
} from '@/lib/scoring';

/**
 * Step 3: Generate comprehensive storyboard analysis
 * Duration: ~60-90 seconds
 * Updates job status to 'storyboarding', generates analysis, then marks as completed
 */
export async function processStoryboard(jobId: string) {
  const supabase = createServiceClient();

  try {
    console.log(`[Storyboard] Starting for job ${jobId}`);

    // Update status to 'storyboarding'
    await supabase
      .from('analysis_jobs')
      .update({ status: 'storyboarding' })
      .eq('id', jobId);

    // Fetch job with all previous results
    const { data: job, error: fetchError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      throw new Error(`Failed to fetch job: ${fetchError?.message || 'Job not found'}`);
    }

    if (!job.lint_result) {
      throw new Error('Lint result not found. Run linting first.');
    }

    // Use video_url for YouTube, or file_uri for uploaded files
    const videoSource = job.video_url || job.file_uri;
    const isUploadedFile = !job.video_url && !!job.file_uri;

    if (!videoSource) {
      throw new Error('No video source available (neither video_url nor file_uri)');
    }

    console.log(`[Storyboard] Processing video: ${videoSource}`);

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    if (!client.analyzeVideo) {
      throw new Error('Client does not support video analysis');
    }

    // ============================================
    // STEP 1: Extract signals from video
    // ============================================
    console.log('[Storyboard] Step 1: Extracting signals...');
    const signalResponse = await client.analyzeVideo(videoSource, SIGNAL_EXTRACTION_PROMPT, {
      temperature: 0.0, // Maximum consistency for signal extraction
      maxTokens: 8192,
    });

    console.log('[Storyboard] Signal extraction complete, parsing...');
    const signalData = parseSignalJSON(signalResponse.content);

    // ============================================
    // STEP 2: Calculate deterministic scores
    // ============================================
    console.log('[Storyboard] Step 2: Calculating deterministic scores...');

    // Use format from signal extraction, fallback to classification result, then default
    const videoFormat: VideoFormat =
      signalData.format ||
      job.classification_result?.format ||
      'talking_head';

    console.log('[Storyboard] Video format:', videoFormat);

    const scoreResult = calculateDeterministicScores(signalData.signals, videoFormat);

    console.log('[Storyboard] Scores calculated:', {
      format: videoFormat,
      hook: scoreResult.subScores.hook,
      structure: scoreResult.subScores.structure,
      clarity: scoreResult.subScores.clarity,
      delivery: scoreResult.subScores.delivery,
      total: scoreResult.totalScore,
    });

    // ============================================
    // STEP 3: Generate analysis with calculated scores
    // ============================================
    console.log('[Storyboard] Step 3: Generating analysis...');
    const analysisPrompt = buildAnalysisPrompt(
      job.lint_result.violations,
      signalData.signals,
      scoreResult,
      signalData.transcript,
      signalData.beatTimestamps
    );

    const analysisResponse = await client.analyzeVideo(videoSource, analysisPrompt, {
      temperature: 0.1, // Slight creativity for explanations
      maxTokens: 16384,
    });

    console.log('[Storyboard] Analysis complete, parsing JSON...');
    const storyboard = parseStoryboardJSON(analysisResponse.content);

    // Inject calculated scores (ensure they match what we calculated)
    storyboard.performance.hookStrength = scoreResult.subScores.hook;
    storyboard.performance.structurePacing = scoreResult.subScores.structure;
    storyboard.performance.deliveryPerformance = scoreResult.subScores.delivery;
    if (storyboard.performance.content) {
      storyboard.performance.content.valueClarity = scoreResult.subScores.clarity;
    }

    // Store signals and breakdown for transparency
    storyboard._format = videoFormat;
    storyboard._signals = signalData.signals;
    storyboard._scoreBreakdown = scoreResult.breakdown;
    storyboard._deterministicScore = scoreResult.totalScore;

    // Extract and deduplicate beat issues
    const { uniqueBeatIssues, counts } = extractBeatIssues(storyboard);

    // Calculate bonus points (using deterministic score as base)
    const { finalScore, baseScore, bonusPoints, bonusDetails } = calculateScoreWithDeterministicBase(
      uniqueBeatIssues,
      storyboard,
      scoreResult.totalScore
    );

    console.log(`[Storyboard] Score: ${finalScore} (deterministic base: ${scoreResult.totalScore}, bonus: ${bonusPoints})`);

    // Fetch YouTube statistics (only for YouTube videos, not uploaded files)
    const videoStats = isUploadedFile ? null : await fetchYouTubeStats(job.video_url);

    // Add videoStats to storyboard.performance
    if (storyboard?.performance && videoStats) {
      storyboard.performance.videoStats = videoStats;
      console.log('[Storyboard] Added video stats:', videoStats);
    }

    // Build final response structure
    const storyboardResult = {
      url: job.video_url || job.file_uri,
      isUploadedFile,
      classification: job.classification_result,
      lintSummary: {
        totalRules: job.lint_result?.totalRules || 0,
        score: finalScore,
        baseScore: baseScore,
        bonusPoints: bonusPoints,
        bonusDetails: bonusDetails,
        passed: (job.lint_result?.totalRules || 0) - uniqueBeatIssues.length,
        moderate: counts.moderate,
        critical: counts.critical,
        minor: counts.minor,
        totalIssues: uniqueBeatIssues.length,
      },
      storyboard,
    };

    // Store result and mark as completed
    const { error: updateError } = await supabase
      .from('analysis_jobs')
      .update({
        status: 'completed',
        current_step: 3,
        storyboard_result: storyboardResult,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`);
    }

    console.log(`[Storyboard] Completed for job ${jobId}`);

    return { success: true, storyboardResult };
  } catch (error) {
    console.error(`[Storyboard] Error for job ${jobId}:`, error);

    // Update job with error status
    const errorMessage = error instanceof Error ? error.message : 'Storyboard generation failed';

    await supabase
      .from('analysis_jobs')
      .update({
        status: 'failed',
        error_message: `Storyboard generation failed: ${errorMessage}`,
      })
      .eq('id', jobId);

    throw error;
  }
}

// Helper functions

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
    "hookCategory": "string - MUST be one of: 'Outcome-first', 'Relatable pain', 'Contradiction / Myth-busting', 'Shock / Bold claim', 'Curiosity gap', 'Authority / Credibility', 'Specific number / specificity', 'Direct call-out', 'Pattern interrupt (verbal)', 'Before / After contrast', 'Time-bound promise', 'Negative framing', 'Question hook', 'Other'",
    "hookPattern": "string - specific description of the hook approach used (e.g., 'Quick win promise with timeframe', 'Personal pain point revealed')",
    "nicheCategory": "string - MUST be one of: 'Creator / Personal Brand', 'Business / Career', 'Tech / AI', 'Productivity / Mindset', 'Money / Growth', 'Marketing / Growth', 'Education / Explainer', 'Life / Psychology', 'Design / Creative', 'Other'",
    "nicheDescription": "string - specific subcategory (e.g., 'AI tools', 'YouTube growth / Shorts growth', 'Copywriting', 'Mental models')",
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
            "suggestion": "string - specific actionable fix",
            "ruleId": "string - OPTIONAL, only include if this issue comes from a lint violation (e.g., 'th_hook_timing'). Omit for AI-discovered issues.",
            "ruleName": "string - OPTIONAL, only include if this issue comes from a lint violation (e.g., 'Hook Within 3 Seconds'). Omit for AI-discovered issues."
          }
        ]
      }
    }
  ],
  "performance": {
    "score": number - 0-10 overall score,
    "hookStrength": number - 0-100 score for hook quality,
    "structurePacing": number - 0-100 score for structure and pacing,
    "deliveryPerformance": number - 0-100 score for delivery quality,
    "directorAssessment": "string - Professional director's review in bullet point format. Start each category with ONE main diagnosis line (no bold), followed by 2-3 supporting bullet points. Use newlines (\\n) to separate lines. Format:\n\nMain diagnosis for hook/opening\n• Supporting detail 1\n• Supporting detail 2\n\nMain diagnosis for structure/pacing\n• Supporting detail 1\n• Supporting detail 2\n\nViral potential: realistic range (e.g., '50-150K views' or '300K-1M views')\n\nUse filmmaker language. Be direct and professional. No excessive formatting.",
    "retentionDrivers": ["string - key element 1", "string - key element 2", "..."],
    "pacingStrategy": "string - how video maintains momentum",
    "visualEngagementTactics": "string - text overlays, cuts, B-roll, etc.",
    "hook": {
      "duration": number - seconds of hook (0-5),
      "viralPattern": number - 0-100 how well it matches viral patterns,
      "loopStrength": number - 0-100 re-watch potential,
      "analysis": "string - One main diagnosis followed by 2-3 supporting bullet points. Use newlines (\\n) to separate. Format: Main diagnosis\\nSupporting point 1\\nSupporting point 2. No bold formatting."
    },
    "structure": {
      "videoLength": number - total seconds,
      "pacingConsistency": number - 0-100 how consistent the pacing is,
      "payoffTiming": number - 0-100 how well-timed the payoff is,
      "analysis": "string - One main diagnosis followed by 2-3 supporting bullet points. Use newlines (\\n) to separate. Format: Main diagnosis\\nSupporting point 1\\nSupporting point 2. No bold formatting."
    },
    "content": {
      "contentType": "string - Educational/Entertainment/Tutorial/Story/etc",
      "valueClarity": number - 0-100 how clear the value proposition is,
      "uniqueness": number - 0-100 how unique the angle/perspective is,
      "analysis": "string - One main diagnosis followed by 2-3 supporting bullet points. Use newlines (\\n) to separate. Format: Main diagnosis\\nSupporting point 1\\nSupporting point 2. No bold formatting."
    },
    "delivery": {
      "energyLevel": number - 0-100 vocal energy and enthusiasm,
      "vocalClarity": number - 0-100 how clear and understandable speech is,
      "presence": number - 0-100 camera presence and charisma,
      "analysis": "string - One main diagnosis followed by 2-3 supporting bullet points. Use newlines (\\n) to separate. Format: Main diagnosis\\nSupporting point 1\\nSupporting point 2. No bold formatting."
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
2. Include the violation in that beat's retention.issues array, preserving ruleId and ruleName from the lint violation
3. For AI-discovered issues (not from lint violations), include severity/message/suggestion but OMIT ruleId and ruleName
4. Ensure retention.level accurately reflects the severity of issues found
5. Be specific with timestamps - use actual seconds from the video
6. Return ONLY the JSON object, no additional text or explanation
7. Ensure all JSON is properly formatted and escaped
7. FORMAT ANALYSIS WITH HIERARCHY: In the hook, structure, content, delivery, and directorAssessment fields, start with ONE main diagnosis, followed by 2-3 supporting bullet points. Use newlines (\\n) to separate lines. No bold formatting. Example: "Hook shows strong pattern-matching\\nOpening grabs attention at 0:02s\\nCould benefit from more direct promise"
8. HOOK CATEGORY SELECTION: Choose the MOST DOMINANT hook type from the predefined list. Context for each:
   - Outcome-first: Promises result/benefit upfront
   - Relatable pain: Surfaces unspoken viewer struggle
   - Contradiction / Myth-busting: Challenges common belief
   - Shock / Bold claim: Extreme/counterintuitive statement
   - Curiosity gap: Incomplete info forces continuation
   - Authority / Credibility: Establishes expertise quickly
   - Specific number / specificity: Uses concrete data/metrics
   - Direct call-out: Targets specific audience segment
   - Pattern interrupt (verbal): Unusual delivery/phrasing
   - Before / After contrast: Shows transformation
   - Time-bound promise: Emphasizes speed/urgency
   - Negative framing: Leads with mistake/risk
   - Question hook: Poses unspoken viewer question
   - Other: Mixed or unique approach
9. NICHE CATEGORY SELECTION: Choose the PRIMARY niche. Available categories:
   - Creator / Personal Brand: Content creation, YouTube/Shorts growth, Personal branding, Creator workflows
   - Business / Career: Startups, SaaS, Entrepreneurship, Freelancing, Career advice
   - Tech / AI: AI tools, No-code/Automation, Developer productivity, Tech explainers
   - Productivity / Mindset: Productivity, Time management, Focus/Deep work, Note-taking
   - Money / Growth: Make money online, Side hustles, Personal finance, Investing basics
   - Marketing / Growth: Marketing tactics, Copywriting, Growth hacking, Social media strategy
   - Education / Explainer: Learning hacks, Quick explainers, Mental models
   - Life / Psychology: Self-improvement, Psychology, Habits, Rational motivation
   - Design / Creative: UI/UX design, Design critique, Creative process
   - Other: Mixed or uncategorized content
10. PAYOFF CLARITY DISTINCTION - Critical for avoiding false positives on mature creators:
   - "No Payoff / No Answer" (CRITICAL): Video truly delivers NO answer at all. The promise is never fulfilled.
   - "Delayed Payoff Clarity" (MODERATE): Answer IS stated, but full clarity/demonstration/impact comes later. The viewer gets the answer early but doesn't feel the full value until later in the video.
   - Example of delayed clarity: "Here's the trick: use keywords" (answer stated at 0:10) but demonstration of how to actually use keywords doesn't appear until 0:45.
   - When mapping lint violations, respect this distinction. Don't mark mature creators with critical violations when they're intentionally pacing their content.
11. LANGUAGE ALIGNMENT - CRITICAL:
   - Detect the primary language spoken in the video
   - ALL output text (transcripts, analysis, suggestions, director's assessment) MUST be in the SAME language as the video
   - If the video is in English, output ONLY in English
   - If the video is in Hindi, output ONLY in Hindi
   - Do NOT mix languages. Do NOT let reference videos or viral examples influence the output language
   - The output language MUST match the input video's spoken language, regardless of any other context

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

function parseStoryboardJSON(content: string): any {
  try {
    let jsonText = content.trim();

    // Handle markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Failed to parse storyboard JSON:', content);
    throw new Error('Failed to parse storyboard analysis');
  }
}

function parseSignalJSON(content: string): SignalExtractionResult {
  try {
    let jsonText = content.trim();

    // Handle markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.signals) {
      throw new Error('Missing signals in extraction result');
    }

    // Validate and normalize format
    const validFormats = ['talking_head', 'gameplay', 'other'];
    const format = validFormats.includes(parsed.format) ? parsed.format : 'talking_head';

    // Provide defaults for missing optional fields
    return {
      format: format as VideoFormat,
      signals: {
        hook: {
          TTClaim: parsed.signals.hook?.TTClaim ?? 3,
          PB: parsed.signals.hook?.PB ?? 3,
          Spec: parsed.signals.hook?.Spec ?? 0,
          QC: parsed.signals.hook?.QC ?? 0,
        },
        structure: {
          BC: parsed.signals.structure?.BC ?? 4,
          PM: parsed.signals.structure?.PM ?? 0,
          PP: parsed.signals.structure?.PP ?? false,
          LC: parsed.signals.structure?.LC ?? false,
        },
        clarity: {
          wordCount: parsed.signals.clarity?.wordCount ?? 100,
          duration: parsed.signals.clarity?.duration ?? 30,
          SC: parsed.signals.clarity?.SC ?? 3,
          TJ: parsed.signals.clarity?.TJ ?? 0,
          RD: parsed.signals.clarity?.RD ?? 2,
        },
        delivery: {
          LS: parsed.signals.delivery?.LS ?? 3,
          NS: parsed.signals.delivery?.NS ?? 3,
          pauseCount: parsed.signals.delivery?.pauseCount ?? 2,
          fillerCount: parsed.signals.delivery?.fillerCount ?? 0,
          EC: parsed.signals.delivery?.EC ?? true,
        },
      },
      transcript: parsed.transcript || '',
      beatTimestamps: parsed.beatTimestamps || [],
    };
  } catch (error) {
    console.error('Failed to parse signal JSON:', content);
    throw new Error('Failed to parse signal extraction result');
  }
}

function extractBeatIssues(storyboard: any) {
  const beatIssues: any[] = [];

  if (storyboard.beats && Array.isArray(storyboard.beats)) {
    storyboard.beats.forEach((beat: any, beatIdx: number) => {
      if (beat.retention?.issues && Array.isArray(beat.retention.issues)) {
        beat.retention.issues.forEach((issue: any) => {
          beatIssues.push({
            ...issue,
            beatNumber: beat.beatNumber || beatIdx + 1,
            timestamp: `${beat.startTime}s-${beat.endTime}s`,
          });
        });
      }
    });
  }

  // Deduplicate beat issues by message
  const uniqueBeatIssues = Array.from(
    beatIssues.reduce((map, issue) => {
      const key = issue.message?.toLowerCase().trim() || Math.random().toString();
      if (!map.has(key)) {
        map.set(key, issue);
      }
      return map;
    }, new Map()).values()
  );

  // Count by severity
  const counts = {
    critical: uniqueBeatIssues.filter((i: any) => i.severity === 'critical').length,
    moderate: uniqueBeatIssues.filter((i: any) => i.severity === 'moderate').length,
    minor: uniqueBeatIssues.filter((i: any) => i.severity === 'minor').length,
  };

  return { uniqueBeatIssues, counts };
}

/**
 * Calculate score with deterministic base
 * Uses the deterministic score as the base, then applies bonuses
 */
function calculateScoreWithDeterministicBase(
  uniqueBeatIssues: any[],
  storyboard: any,
  deterministicBase: number
) {
  console.log('=== DETERMINISTIC SCORING ===');
  console.log('Deterministic base score:', deterministicBase);
  console.log('Unique beat issues:', uniqueBeatIssues.length);

  // Count issues by severity for display
  const counts = uniqueBeatIssues.reduce(
    (acc, issue) => {
      if (issue.severity === 'critical') acc.critical++;
      if (issue.severity === 'moderate') acc.moderate++;
      if (issue.severity === 'minor') acc.minor++;
      return acc;
    },
    { critical: 0, moderate: 0, minor: 0 }
  );

  console.log('Issues - Critical:', counts.critical, 'Moderate:', counts.moderate, 'Minor:', counts.minor);

  // Use deterministic score as base
  const baseScore = deterministicBase;

  // Calculate bonus points
  let bonusPoints = 0;
  const bonusDetails: string[] = [];

  // Bonus 1: Perfect beats (no issues) - +2 points each
  if (storyboard.beats && Array.isArray(storyboard.beats)) {
    const perfectBeats = storyboard.beats.filter(
      (beat: any) => !beat.retention?.issues || beat.retention.issues.length === 0
    ).length;

    if (perfectBeats > 0) {
      const perfectBeatBonus = perfectBeats * 2;
      bonusPoints += perfectBeatBonus;
      bonusDetails.push(`${perfectBeats} perfect beat${perfectBeats > 1 ? 's' : ''}: +${perfectBeatBonus}`);
    }
  }

  // Bonus 2: Strong hook (>= 80/100) - +5 points
  if (storyboard.performance?.hookStrength >= 80) {
    bonusPoints += 5;
    bonusDetails.push(`Strong hook (${storyboard.performance.hookStrength}/100): +5`);
  }

  const finalScore = baseScore + bonusPoints;

  console.log('Bonus points:', bonusPoints);
  console.log('Final score:', finalScore);
  console.log('========================');

  return { finalScore, baseScore, bonusPoints, bonusDetails };
}

// Keep old function for backward compatibility (not used in new flow)
function calculateScore(uniqueBeatIssues: any[], storyboard: any) {
  const { critical, moderate, minor } = uniqueBeatIssues.reduce(
    (acc, issue) => {
      if (issue.severity === 'critical') acc.critical++;
      if (issue.severity === 'moderate') acc.moderate++;
      if (issue.severity === 'minor') acc.minor++;
      return acc;
    },
    { critical: 0, moderate: 0, minor: 0 }
  );

  // Calculate base score
  let baseScore = 100;
  baseScore -= critical * 10;
  baseScore -= moderate * 5;
  baseScore -= minor * 2;
  baseScore = Math.max(0, baseScore);

  console.log('=== BEAT ISSUES SCORING ===');
  console.log('Unique beat issues:', uniqueBeatIssues.length);
  console.log('Critical:', critical, 'x -10 =', critical * -10);
  console.log('Moderate:', moderate, 'x -5 =', moderate * -5);
  console.log('Minor:', minor, 'x -2 =', minor * -2);
  console.log('Beat score:', baseScore);

  // Calculate bonus points
  let bonusPoints = 0;
  const bonusDetails: string[] = [];

  // Bonus 1: Perfect beats (no issues) - +2 points each
  if (storyboard.beats && Array.isArray(storyboard.beats)) {
    const perfectBeats = storyboard.beats.filter((beat: any) =>
      !beat.retention?.issues || beat.retention.issues.length === 0
    ).length;

    if (perfectBeats > 0) {
      const perfectBeatBonus = perfectBeats * 2;
      bonusPoints += perfectBeatBonus;
      bonusDetails.push(`${perfectBeats} perfect beat${perfectBeats > 1 ? 's' : ''}: +${perfectBeatBonus}`);
    }
  }

  // Bonus 2: Strong hook (>= 80/100) - +5 points
  if (storyboard.performance?.hookStrength >= 80) {
    bonusPoints += 5;
    bonusDetails.push(`Strong hook (${storyboard.performance.hookStrength}/100): +5`);
  }

  const finalScore = baseScore + bonusPoints;

  console.log('Bonus points:', bonusPoints);
  console.log('Final score:', finalScore);
  console.log('========================');

  return { finalScore, baseScore, bonusPoints, bonusDetails };
}

async function fetchYouTubeStats(url: string) {
  try {
    const videoId = extractYouTubeId(url);
    if (!videoId) return null;

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      console.log('No YouTube API key provided, skipping stats fetch');
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${youtubeApiKey}`
    );

    if (!response.ok) {
      console.error('YouTube API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('No video found for ID:', videoId);
      return null;
    }

    const stats = data.items[0].statistics;
    return {
      views: parseInt(stats.viewCount || '0', 10),
      likes: parseInt(stats.likeCount || '0', 10),
      comments: parseInt(stats.commentCount || '0', 10),
    };
  } catch (error) {
    console.error('Error fetching YouTube stats:', error);
    return null;
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
