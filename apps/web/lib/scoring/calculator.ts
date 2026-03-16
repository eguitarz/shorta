/**
 * Deterministic Score Calculator
 *
 * Pure functions that transform extracted signals into scores.
 * No LLM involvement - same input always produces same output.
 */

import type {
  VideoSignals,
  SubScores,
  ScoreBreakdown,
  DeterministicScoreResult,
  HookScoreBreakdown,
  StructureScoreBreakdown,
  ClarityScoreBreakdown,
  DeliveryScoreBreakdown,
} from './types';

import {
  WEIGHTS,
  NICHE_WEIGHTS,
  TTCLAIM_THRESHOLDS,
  TTCLAIM_THRESHOLDS_LONG,
  BEAT_COUNT_THRESHOLDS,
  WPS_THRESHOLDS,
  FILLER_PENALTY,
  MAX_GOOD_PAUSES,
  STRUCTURE_WEIGHTS_LONG,
  isLongForm,
  getBeatCountThresholds,
  getMaxGoodPauses,
  getMaxGoodTopicJumps,
} from './constants';

import type { VideoFormat } from '@/lib/linter/types';

// ============================================
// Utility Functions
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function linearInterpolate(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  const ratio = (value - fromMin) / (fromMax - fromMin);
  return toMin + ratio * (toMax - toMin);
}

// ============================================
// Hook Signal Transformations
// ============================================

/**
 * Score time-to-claim (TTClaim)
 * Duration-aware: long-form videos have wider acceptable hook windows.
 *
 * Short-form (≤90s): ≤1s=100, 1-3s→70, 3-5s→40, ≥7s=0
 * Long-form  (>90s): ≤5s=100, 5-10s→70, 10-20s→40, ≥30s=0
 */
export function scoreTTClaim(seconds: number, videoDuration?: number): number {
  const thresholds = videoDuration && isLongForm(videoDuration)
    ? TTCLAIM_THRESHOLDS_LONG
    : TTCLAIM_THRESHOLDS;
  const { excellent, good, fair, poor } = thresholds;

  if (seconds <= excellent) return 100;
  if (seconds <= good) return Math.round(linearInterpolate(seconds, excellent, good, 100, 70));
  if (seconds <= fair) return Math.round(linearInterpolate(seconds, good, fair, 70, 40));
  if (seconds <= poor) return Math.round(linearInterpolate(seconds, fair, poor, 40, 0));
  return 0;
}

/**
 * Score pattern break (PB)
 * - 1-5 scale -> 0-100
 */
export function scorePB(rating: number): number {
  return clamp(Math.round((rating - 1) * 25), 0, 100);
}

/**
 * Score specificity (Spec)
 * - 0 specifics = 0
 * - 1 = 50
 * - 2 = 75
 * - 3+ = 100
 */
export function scoreSpec(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 50;
  if (count === 2) return 75;
  return 100;
}

/**
 * Score question/contradiction (QC)
 * - Has any = 100
 * - None = 0
 */
export function scoreQC(count: number): number {
  return count > 0 ? 100 : 0;
}

// ============================================
// Structure Signal Transformations
// ============================================

/**
 * Score beat count (BC)
 * Duration-aware: long-form videos need more beats.
 *
 * Short-form: sweet spot 3-6 beats
 * Long-form: ~1 beat per 30-45 seconds (scales with duration)
 */
export function scoreBC(beatCount: number, videoDuration?: number): number {
  const thresholds = videoDuration
    ? getBeatCountThresholds(videoDuration)
    : BEAT_COUNT_THRESHOLDS;
  const { idealMin, idealMax, acceptableMin, acceptableMax } = thresholds;

  if (beatCount >= idealMin && beatCount <= idealMax) return 100;
  if (beatCount >= acceptableMin && beatCount <= acceptableMax) return 75;
  // For long-form, having fewer beats than minimum is worse
  if (beatCount < acceptableMin) return Math.max(25, Math.round(50 * (beatCount / acceptableMin)));
  // Too many beats: slight penalty
  return 50;
}

/**
 * Score progress markers (PM)
 * - 0 = 0
 * - 1 = 60
 * - 2 = 80
 * - 3+ = 100
 */
export function scorePM(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 60;
  if (count === 2) return 80;
  return 100;
}

/**
 * Score payoff presence (PP)
 * Binary: has payoff = 100, no payoff = 0
 */
export function scorePP(hasPayoff: boolean): number {
  return hasPayoff ? 100 : 0;
}

/**
 * Score loop cue (LC)
 * Duration-aware: loop cues only matter for short-form (auto-looping Shorts).
 * Long-form videos don't auto-loop, so no loop cue is neutral (not a penalty).
 *
 * Short-form: has loop = 100, no loop = 0
 * Long-form:  has loop = 100 (nice callback), no loop = 75 (neutral, expected)
 */
export function scoreLC(hasLoop: boolean, videoDuration?: number): number {
  if (hasLoop) return 100;
  // Long-form: not having a loop cue is fine — videos don't auto-replay
  if (videoDuration && isLongForm(videoDuration)) return 75;
  return 0;
}

// ============================================
// Clarity Signal Transformations
// ============================================

/**
 * Score words per second (WPS)
 * - 3-4 WPS = 100 (ideal)
 * - 2.5-3 or 4-4.5 = 85
 * - 2-2.5 or 4.5-5 = 65
 * - <2 = 40 (too slow)
 * - >5 = 50 (too fast)
 */
export function scoreWPS(wordCount: number, duration: number): number {
  if (duration <= 0) return 50;

  const wps = wordCount / duration;
  const { idealMin, idealMax, acceptableMin, acceptableMax, minAcceptable, maxAcceptable } =
    WPS_THRESHOLDS;

  if (wps >= idealMin && wps <= idealMax) return 100;
  if (wps >= acceptableMin && wps < idealMin) return 85;
  if (wps > idealMax && wps <= acceptableMax) return 85;
  if (wps >= minAcceptable && wps < acceptableMin) return 65;
  if (wps > acceptableMax && wps <= maxAcceptable) return 65;
  if (wps < minAcceptable) return 40;
  return 50; // > maxAcceptable
}

/**
 * Score sentence complexity (SC)
 * Inverted: simpler = better
 * - 1 = 100
 * - 5 = 0
 */
export function scoreSC(complexity: number): number {
  return clamp(Math.round(100 - (complexity - 1) * 25), 0, 100);
}

/**
 * Score topic jumps (TJ)
 * Duration-aware: long-form videos naturally cover more topics.
 *
 * Short-form: 0 jumps = 100, 3+ = 25
 * Long-form: scales based on duration (~1 topic per 2-3 minutes is natural)
 */
export function scoreTJ(jumpCount: number, videoDuration?: number): number {
  const maxGood = videoDuration ? getMaxGoodTopicJumps(videoDuration) : 0;

  if (jumpCount <= maxGood) return 100;
  if (jumpCount <= maxGood + 1) return 75;
  if (jumpCount <= maxGood + 2) return 50;
  return 25;
}

/**
 * Score redundancy (RD)
 * Inverted: less redundancy = better
 * - 1 = 100
 * - 5 = 0
 */
export function scoreRD(redundancy: number): number {
  return clamp(Math.round(100 - (redundancy - 1) * 25), 0, 100);
}

// ============================================
// Delivery Signal Transformations
// ============================================

/**
 * Score loudness stability (LS)
 * - 1-5 scale -> 0-100
 */
export function scoreLS(volumeConsistency: number): number {
  return clamp(Math.round((volumeConsistency - 1) * 25), 0, 100);
}

/**
 * Score noise/audio quality (NS)
 * - 1-5 scale -> 0-100
 */
export function scoreNS(audioQuality: number): number {
  return clamp(Math.round((audioQuality - 1) * 25), 0, 100);
}

/**
 * Score pause quality (PQ)
 * Duration-aware: long-form videos naturally have more pauses.
 *
 * - Ideal: appropriate pauses for duration, 0-2 fillers
 * - No pauses = rushed (70)
 * - Too many pauses = hesitant (penalty, scaled by duration)
 * - Fillers penalized (scaled by duration for long-form)
 */
export function scorePQ(pauseCount: number, fillerCount: number, videoDuration?: number): number {
  const maxPauses = videoDuration ? getMaxGoodPauses(videoDuration) : MAX_GOOD_PAUSES;

  // Pause score
  let pauseScore = 100;
  if (pauseCount === 0) {
    pauseScore = 70; // No pauses feels rushed
  } else if (pauseCount > maxPauses) {
    pauseScore = Math.max(30, 100 - (pauseCount - maxPauses) * 10);
  }

  // Filler score — for long-form, reduce penalty per filler (some fillers are natural in 15+ min)
  const fillerPenalty = videoDuration && isLongForm(videoDuration)
    ? Math.max(3, Math.round(FILLER_PENALTY * 60 / videoDuration)) // Scale penalty down by duration
    : FILLER_PENALTY;
  const fillerScore = Math.max(0, 100 - fillerCount * fillerPenalty);

  // Average the two
  return Math.round((pauseScore + fillerScore) / 2);
}

/**
 * Score energy curve (EC)
 * - Has variation = 100
 * - Monotone = 40
 */
export function scoreEC(hasVariation: boolean): number {
  return hasVariation ? 100 : 40;
}

// ============================================
// Category Score Calculators
// ============================================

export function calculateHookScore(signals: VideoSignals['hook'], videoDuration?: number): {
  score: number;
  breakdown: HookScoreBreakdown;
} {
  const breakdown: HookScoreBreakdown = {
    TTClaim: scoreTTClaim(signals.TTClaim, videoDuration),
    PB: scorePB(signals.PB),
    Spec: scoreSpec(signals.Spec),
    QC: scoreQC(signals.QC),
  };

  const score = Math.round(
    breakdown.TTClaim * WEIGHTS.hook.TTClaim +
      breakdown.PB * WEIGHTS.hook.PB +
      breakdown.Spec * WEIGHTS.hook.Spec +
      breakdown.QC * WEIGHTS.hook.QC
  );

  return { score, breakdown };
}

export function calculateStructureScore(signals: VideoSignals['structure'], videoDuration?: number): {
  score: number;
  breakdown: StructureScoreBreakdown;
} {
  const breakdown: StructureScoreBreakdown = {
    BC: scoreBC(signals.BC, videoDuration),
    PM: scorePM(signals.PM),
    PP: scorePP(signals.PP),
    LC: scoreLC(signals.LC, videoDuration),
  };

  // Use long-form weights if applicable (reduces LC weight, boosts PP/PM)
  const structWeights = videoDuration && isLongForm(videoDuration)
    ? STRUCTURE_WEIGHTS_LONG
    : WEIGHTS.structure;

  const score = Math.round(
    breakdown.BC * structWeights.BC +
      breakdown.PM * structWeights.PM +
      breakdown.PP * structWeights.PP +
      breakdown.LC * structWeights.LC
  );

  return { score, breakdown };
}

export function calculateClarityScore(signals: VideoSignals['clarity'], videoDuration?: number): {
  score: number;
  breakdown: ClarityScoreBreakdown;
} {
  const breakdown: ClarityScoreBreakdown = {
    WPS: scoreWPS(signals.wordCount, signals.duration),
    SC: scoreSC(signals.SC),
    TJ: scoreTJ(signals.TJ, videoDuration),
    RD: scoreRD(signals.RD),
  };

  const score = Math.round(
    breakdown.WPS * WEIGHTS.clarity.WPS +
      breakdown.SC * WEIGHTS.clarity.SC +
      breakdown.TJ * WEIGHTS.clarity.TJ +
      breakdown.RD * WEIGHTS.clarity.RD
  );

  return { score, breakdown };
}

export function calculateDeliveryScore(
  signals: VideoSignals['delivery'],
  format: VideoFormat = 'talking_head',
  videoDuration?: number
): {
  score: number;
  breakdown: DeliveryScoreBreakdown;
} {
  // For non-speech formats, pause/filler metrics are less relevant
  // Use neutral values if the format doesn't have speech
  // Demo and talking_head both typically have voiceover/speech
  const isVoiceBased = format === 'talking_head' || format === 'demo';

  const breakdown: DeliveryScoreBreakdown = {
    LS: scoreLS(signals.LS),
    NS: scoreNS(signals.NS),
    // For gameplay/faceless, use neutral PQ score if no meaningful speech
    PQ: isVoiceBased
      ? scorePQ(signals.pauseCount, signals.fillerCount, videoDuration)
      : scorePQ(2, 0), // Neutral: 2 pauses, 0 fillers
    EC: scoreEC(signals.EC),
  };

  const score = Math.round(
    breakdown.LS * WEIGHTS.delivery.LS +
      breakdown.NS * WEIGHTS.delivery.NS +
      breakdown.PQ * WEIGHTS.delivery.PQ +
      breakdown.EC * WEIGHTS.delivery.EC
  );

  return { score, breakdown };
}

// ============================================
// Main Calculator
// ============================================

/**
 * Calculate all deterministic scores from extracted signals.
 * This is the main entry point for scoring.
 *
 * Duration-aware: thresholds automatically adapt for short-form (≤90s)
 * vs long-form (>90s) videos. Duration is read from signals.clarity.duration.
 *
 * @param signals - Extracted video signals
 * @param format - Video format for niche-specific weights (default: talking_head)
 */
export function calculateDeterministicScores(
  signals: VideoSignals,
  format: VideoFormat = 'talking_head'
): DeterministicScoreResult {
  const videoDuration = signals.clarity.duration;

  // Calculate each category (duration-aware)
  const hookResult = calculateHookScore(signals.hook, videoDuration);
  const structureResult = calculateStructureScore(signals.structure, videoDuration);
  const clarityResult = calculateClarityScore(signals.clarity, videoDuration);
  const deliveryResult = calculateDeliveryScore(signals.delivery, format, videoDuration);

  // Combine sub-scores into total
  const subScores: SubScores = {
    hook: hookResult.score,
    structure: structureResult.score,
    clarity: clarityResult.score,
    delivery: deliveryResult.score,
  };

  // Use niche-specific weights for total score
  const nicheWeights = NICHE_WEIGHTS[format] || NICHE_WEIGHTS.talking_head;

  const totalScore = Math.round(
    subScores.hook * nicheWeights.hook +
      subScores.structure * nicheWeights.structure +
      subScores.clarity * nicheWeights.clarity +
      subScores.delivery * nicheWeights.delivery
  );

  return {
    signals,
    subScores,
    totalScore,
    breakdown: {
      hook: hookResult.breakdown,
      structure: structureResult.breakdown,
      clarity: clarityResult.breakdown,
      delivery: deliveryResult.breakdown,
    },
  };
}
