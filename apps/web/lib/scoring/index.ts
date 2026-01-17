/**
 * Deterministic Scoring System
 *
 * Usage:
 * 1. Extract signals from video using SIGNAL_EXTRACTION_PROMPT
 * 2. Calculate scores using calculateDeterministicScores()
 * 3. Generate analysis using buildAnalysisPrompt()
 */

// Types
export type {
  VideoSignals,
  HookSignals,
  StructureSignals,
  ClaritySignals,
  DeliverySignals,
  VideoFormat,
  BeatTimestamp,
  SignalExtractionResult,
  SubScores,
  ScoreBreakdown,
  HookScoreBreakdown,
  StructureScoreBreakdown,
  ClarityScoreBreakdown,
  DeliveryScoreBreakdown,
  DeterministicScoreResult,
  CategoryExplanation,
  ScoreExplanations,
} from './types';

// Constants
export { WEIGHTS, TOTAL_WEIGHTS, HOOK_WEIGHTS, STRUCTURE_WEIGHTS, CLARITY_WEIGHTS, DELIVERY_WEIGHTS } from './constants';

// Calculator
export {
  calculateDeterministicScores,
  calculateHookScore,
  calculateStructureScore,
  calculateClarityScore,
  calculateDeliveryScore,
  // Individual score functions (for testing/debugging)
  scoreTTClaim,
  scorePB,
  scoreSpec,
  scoreQC,
  scoreBC,
  scorePM,
  scorePP,
  scoreLC,
  scoreWPS,
  scoreSC,
  scoreTJ,
  scoreRD,
  scoreLS,
  scoreNS,
  scorePQ,
  scoreEC,
} from './calculator';

// Prompts
export { SIGNAL_EXTRACTION_PROMPT, buildAnalysisPrompt } from './prompts';
