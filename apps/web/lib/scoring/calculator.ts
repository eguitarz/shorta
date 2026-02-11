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
  BEAT_COUNT_THRESHOLDS,
  WPS_THRESHOLDS,
  FILLER_PENALTY,
  MAX_GOOD_PAUSES,
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
 * - <= 1s = 100 (excellent)
 * - 1-3s = linear decay to 70
 * - 3-5s = linear decay to 40
 * - 5-7s = linear decay to 0
 * - >= 7s = 0
 */
export function scoreTTClaim(seconds: number): number {
  const { excellent, good, fair, poor } = TTCLAIM_THRESHOLDS;

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
 * Sweet spot: 3-6 beats for Shorts
 * - 3-6 = 100
 * - 2 or 7 = 75
 * - 1 or 8 = 50
 * - else = 25
 */
export function scoreBC(beatCount: number): number {
  const { idealMin, idealMax, acceptableMin, acceptableMax } = BEAT_COUNT_THRESHOLDS;

  if (beatCount >= idealMin && beatCount <= idealMax) return 100;
  if (beatCount === acceptableMin || beatCount === acceptableMax) return 75;
  if (beatCount === 1 || beatCount === 8) return 50;
  return 25;
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
 * Binary: has loop = 100, no loop = 0
 */
export function scoreLC(hasLoop: boolean): number {
  return hasLoop ? 100 : 0;
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
 * Inverted: fewer jumps = better
 * - 0 = 100
 * - 1 = 75
 * - 2 = 50
 * - 3+ = 25
 */
export function scoreTJ(jumpCount: number): number {
  if (jumpCount <= 0) return 100;
  if (jumpCount === 1) return 75;
  if (jumpCount === 2) return 50;
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
 * Combined pause + filler assessment
 * - Ideal: 1-3 pauses, 0-2 fillers
 * - No pauses = rushed (70)
 * - Too many pauses = hesitant (penalty)
 * - Fillers heavily penalized
 */
export function scorePQ(pauseCount: number, fillerCount: number): number {
  // Pause score
  let pauseScore = 100;
  if (pauseCount === 0) {
    pauseScore = 70; // No pauses feels rushed
  } else if (pauseCount > MAX_GOOD_PAUSES) {
    pauseScore = Math.max(30, 100 - (pauseCount - MAX_GOOD_PAUSES) * 10);
  }

  // Filler score
  const fillerScore = Math.max(0, 100 - fillerCount * FILLER_PENALTY);

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

export function calculateHookScore(signals: VideoSignals['hook']): {
  score: number;
  breakdown: HookScoreBreakdown;
} {
  const breakdown: HookScoreBreakdown = {
    TTClaim: scoreTTClaim(signals.TTClaim),
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

export function calculateStructureScore(signals: VideoSignals['structure']): {
  score: number;
  breakdown: StructureScoreBreakdown;
} {
  const breakdown: StructureScoreBreakdown = {
    BC: scoreBC(signals.BC),
    PM: scorePM(signals.PM),
    PP: scorePP(signals.PP),
    LC: scoreLC(signals.LC),
  };

  const score = Math.round(
    breakdown.BC * WEIGHTS.structure.BC +
      breakdown.PM * WEIGHTS.structure.PM +
      breakdown.PP * WEIGHTS.structure.PP +
      breakdown.LC * WEIGHTS.structure.LC
  );

  return { score, breakdown };
}

export function calculateClarityScore(signals: VideoSignals['clarity']): {
  score: number;
  breakdown: ClarityScoreBreakdown;
} {
  const breakdown: ClarityScoreBreakdown = {
    WPS: scoreWPS(signals.wordCount, signals.duration),
    SC: scoreSC(signals.SC),
    TJ: scoreTJ(signals.TJ),
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
  format: VideoFormat = 'talking_head'
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
      ? scorePQ(signals.pauseCount, signals.fillerCount)
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
 * @param signals - Extracted video signals
 * @param format - Video format for niche-specific weights (default: talking_head)
 */
export function calculateDeterministicScores(
  signals: VideoSignals,
  format: VideoFormat = 'talking_head'
): DeterministicScoreResult {
  // Calculate each category
  const hookResult = calculateHookScore(signals.hook);
  const structureResult = calculateStructureScore(signals.structure);
  const clarityResult = calculateClarityScore(signals.clarity);
  const deliveryResult = calculateDeliveryScore(signals.delivery, format);

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
