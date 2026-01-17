/**
 * Deterministic Scoring System Types
 *
 * Separates signal extraction (LLM) from score calculation (formulas)
 */

// ============================================
// Raw Signals (extracted by LLM)
// ============================================

export interface HookSignals {
  /** Seconds until first claim/promise/value proposition */
  TTClaim: number;
  /** Pattern break / energy variation in first 1-3 seconds (1-5 scale) */
  PB: number;
  /** Count of specific elements: numbers, timeframes, costs, proper nouns */
  Spec: number;
  /** Count of questions or contradictions in hook */
  QC: number;
}

export interface StructureSignals {
  /** Total beat/section count in video */
  BC: number;
  /** Count of progress markers ("first", "next", "finally", "step 1") */
  PM: number;
  /** Has clear payoff/answer in last 15% of video */
  PP: boolean;
  /** Loop cue - ending references or loops back to beginning */
  LC: boolean;
}

export interface ClaritySignals {
  /** Total word count in transcript */
  wordCount: number;
  /** Video duration in seconds */
  duration: number;
  /** Sentence complexity (1=simple, 5=complex/run-on) */
  SC: number;
  /** Topic jump count - sudden context switches */
  TJ: number;
  /** Redundancy level (1=concise, 5=very repetitive) */
  RD: number;
}

export interface DeliverySignals {
  /** Volume/loudness consistency (1=inconsistent, 5=consistent) */
  LS: number;
  /** Audio quality / noise level (1=poor/noisy, 5=studio quality) */
  NS: number;
  /** Count of deliberate pauses for effect */
  pauseCount: number;
  /** Count of filler words (um, uh, like, you know) */
  fillerCount: number;
  /** Energy variation present (not monotone) */
  EC: boolean;
}

export interface VideoSignals {
  hook: HookSignals;
  structure: StructureSignals;
  clarity: ClaritySignals;
  delivery: DeliverySignals;
}

// ============================================
// Signal Extraction Response (from LLM)
// ============================================

export type VideoFormat = 'talking_head' | 'gameplay' | 'other';

export interface BeatTimestamp {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
}

export interface SignalExtractionResult {
  format: VideoFormat;
  signals: VideoSignals;
  transcript: string;
  beatTimestamps: BeatTimestamp[];
}

// ============================================
// Calculated Scores (deterministic)
// ============================================

export interface SubScores {
  hook: number;
  structure: number;
  clarity: number;
  delivery: number;
}

export interface HookScoreBreakdown {
  TTClaim: number;
  PB: number;
  Spec: number;
  QC: number;
}

export interface StructureScoreBreakdown {
  BC: number;
  PM: number;
  PP: number;
  LC: number;
}

export interface ClarityScoreBreakdown {
  WPS: number;
  SC: number;
  TJ: number;
  RD: number;
}

export interface DeliveryScoreBreakdown {
  LS: number;
  NS: number;
  PQ: number;
  EC: number;
}

export interface ScoreBreakdown {
  hook: HookScoreBreakdown;
  structure: StructureScoreBreakdown;
  clarity: ClarityScoreBreakdown;
  delivery: DeliveryScoreBreakdown;
}

export interface DeterministicScoreResult {
  signals: VideoSignals;
  subScores: SubScores;
  totalScore: number;
  breakdown: ScoreBreakdown;
}

// ============================================
// LLM Explanations (generated after scores)
// ============================================

export interface CategoryExplanation {
  analysis: string;
  suggestions: string[];
}

export interface ScoreExplanations {
  hook: CategoryExplanation;
  structure: CategoryExplanation;
  clarity: CategoryExplanation;
  delivery: CategoryExplanation;
  directorAssessment: string;
}
