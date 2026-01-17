/**
 * Scoring Weights and Thresholds
 *
 * These can be tuned based on analysis of successful content.
 * All weights within a category should sum to 1.0
 */

import type { VideoFormat } from '@/lib/linter/types';

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

/** TTClaim scoring thresholds (seconds) */
export const TTCLAIM_THRESHOLDS = {
  excellent: 1, // <= 1s = 100
  good: 3, // <= 3s = 70
  fair: 5, // <= 5s = 40
  poor: 7, // >= 7s = 0
} as const;

/** Beat count sweet spot for Shorts */
export const BEAT_COUNT_THRESHOLDS = {
  idealMin: 3,
  idealMax: 6,
  acceptableMin: 2,
  acceptableMax: 7,
} as const;

/** Words per second thresholds */
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

/** Maximum pause count before penalty */
export const MAX_GOOD_PAUSES = 5;

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
