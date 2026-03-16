/**
 * Scoring Weights and Thresholds
 *
 * These can be tuned based on analysis of successful content.
 * All weights within a category should sum to 1.0
 *
 * Duration-aware: thresholds adapt for short-form (≤90s) vs long-form (>90s) videos.
 */

import type { VideoFormat } from '@/lib/linter/types';

// ============================================
// Duration helpers
// ============================================

/** Videos > 90 seconds are considered long-form */
export const LONG_FORM_THRESHOLD_S = 90;

export function isLongForm(durationSeconds: number): boolean {
  return durationSeconds > LONG_FORM_THRESHOLD_S;
}

// ============================================
// Category Weights for Total Score (by niche)
// ============================================

export const TOTAL_WEIGHTS = {
  hook: 0.35,
  structure: 0.25,
  clarity: 0.25,
  delivery: 0.15,
} as const;

/**
 * Niche-specific weights
 * - Talking head: balanced, delivery matters
 * - Gameplay: hook and structure matter most, less speech-dependent
 * - Demo: hook and structure heavy, clarity important for tutorials, delivery less critical
 * - Faceless/Other: hook and structure heavy, minimal delivery weight
 */
export interface CategoryWeights {
  hook: number;
  structure: number;
  clarity: number;
  delivery: number;
}

export const NICHE_WEIGHTS: Record<VideoFormat, CategoryWeights> = {
  talking_head: {
    hook: 0.35,
    structure: 0.25,
    clarity: 0.25,
    delivery: 0.15,
  },
  gameplay: {
    hook: 0.40,
    structure: 0.30,
    clarity: 0.15,
    delivery: 0.15,
  },
  demo: {
    hook: 0.35,
    structure: 0.30,
    clarity: 0.25,
    delivery: 0.10,
  },
  other: {
    hook: 0.40,
    structure: 0.35,
    clarity: 0.15,
    delivery: 0.10,
  },
};

// ============================================
// Sub-component Weights
// ============================================

export const HOOK_WEIGHTS = {
  TTClaim: 0.35, // Time to claim - most important for hook
  PB: 0.25, // Pattern break
  Spec: 0.25, // Specificity
  QC: 0.15, // Question/contradiction
} as const;

export const STRUCTURE_WEIGHTS = {
  BC: 0.30, // Beat count
  PM: 0.25, // Progress markers
  PP: 0.30, // Payoff presence - critical
  LC: 0.15, // Loop cue
} as const;

/** Long-form structure weights: loop cue is irrelevant, redistribute to PP and PM */
export const STRUCTURE_WEIGHTS_LONG = {
  BC: 0.30, // Beat count
  PM: 0.30, // Progress markers (more important in long-form for navigation)
  PP: 0.35, // Payoff presence - critical
  LC: 0.05, // Loop cue - minimal weight (long videos don't auto-loop)
} as const;

export const CLARITY_WEIGHTS = {
  WPS: 0.30, // Words per second
  SC: 0.25, // Sentence complexity
  TJ: 0.25, // Topic jumps
  RD: 0.20, // Redundancy
} as const;

export const DELIVERY_WEIGHTS = {
  LS: 0.35, // Loudness stability - most noticeable
  NS: 0.30, // Noise/audio quality
  PQ: 0.20, // Pause quality
  EC: 0.15, // Energy curve
} as const;

// ============================================
// Thresholds for Score Transformations
// ============================================

/** TTClaim scoring thresholds (seconds) — SHORT-FORM (≤90s) */
export const TTCLAIM_THRESHOLDS = {
  excellent: 1, // <= 1s = 100
  good: 3, // <= 3s = 70
  fair: 5, // <= 5s = 40
  poor: 7, // >= 7s = 0
} as const;

/** TTClaim scoring thresholds — LONG-FORM (>90s)
 * Long-form videos have more breathing room for hooks.
 * Viewers expect some setup before the main value proposition. */
export const TTCLAIM_THRESHOLDS_LONG = {
  excellent: 5,  // <= 5s  = 100 (great hook for long-form)
  good: 10,      // <= 10s = 70  (typical YouTube intro)
  fair: 20,      // <= 20s = 40  (acceptable but slow)
  poor: 30,      // >= 30s = 0   (too slow, viewers leave)
} as const;

/** Beat count sweet spot for Shorts (≤90s) */
export const BEAT_COUNT_THRESHOLDS = {
  idealMin: 3,
  idealMax: 6,
  acceptableMin: 2,
  acceptableMax: 7,
} as const;

/**
 * Get duration-aware beat count thresholds.
 * For long-form: ~1 beat per 30-45 seconds is ideal.
 */
export function getBeatCountThresholds(durationSeconds: number) {
  if (!isLongForm(durationSeconds)) {
    return BEAT_COUNT_THRESHOLDS;
  }
  // Long-form: scale based on duration
  // Ideal: 1 beat per 30-45 seconds
  const idealMin = Math.max(3, Math.floor(durationSeconds / 60));
  const idealMax = Math.max(idealMin + 3, Math.ceil(durationSeconds / 30));
  return {
    idealMin,
    idealMax,
    acceptableMin: Math.max(2, idealMin - 2),
    acceptableMax: idealMax + 5,
  };
}

/** Words per second thresholds (same for all durations — speech pace is universal) */
export const WPS_THRESHOLDS = {
  idealMin: 3.0,
  idealMax: 4.0,
  acceptableMin: 2.5,
  acceptableMax: 4.5,
  minAcceptable: 2.0,
  maxAcceptable: 5.0,
} as const;

/** Filler word penalty per occurrence */
export const FILLER_PENALTY = 15;

/** Maximum pause count before penalty (short-form) */
export const MAX_GOOD_PAUSES = 5;

/**
 * Get duration-aware max good pauses.
 * Long-form: ~1 good pause per 10-15 seconds is fine.
 */
export function getMaxGoodPauses(durationSeconds: number): number {
  if (!isLongForm(durationSeconds)) {
    return MAX_GOOD_PAUSES;
  }
  return Math.max(MAX_GOOD_PAUSES, Math.floor(durationSeconds / 15));
}

/**
 * Get duration-aware max topic jumps before penalty.
 * Short-form: 0 jumps ideal, 3+ = bad.
 * Long-form: natural to cover multiple topics.
 */
export function getMaxGoodTopicJumps(durationSeconds: number): number {
  if (!isLongForm(durationSeconds)) {
    return 0; // Short-form: 0 jumps is ideal
  }
  // Long-form: ~1 topic per 2-3 minutes is natural
  return Math.max(2, Math.floor(durationSeconds / 120));
}

// ============================================
// Combined Weights Object (for convenience)
// ============================================

export const WEIGHTS = {
  total: TOTAL_WEIGHTS,
  hook: HOOK_WEIGHTS,
  structure: STRUCTURE_WEIGHTS,
  clarity: CLARITY_WEIGHTS,
  delivery: DELIVERY_WEIGHTS,
} as const;
