/**
 * Database type definitions for analysis_jobs table
 *
 * This file includes all generated score columns added in migration 014
 * These columns are auto-populated from JSONB fields for fast querying
 */

import type { HookCategory } from '@/lib/scoring/hook-types';

/**
 * Analysis job row from database
 * Includes all generated score columns for efficient filtering and sorting
 */
export interface AnalysisJobRow {
	// Core fields
	id: string;
	user_id: string | null;
	video_url: string | null;
	file_uri: string | null;
	status: 'pending' | 'classifying' | 'linting' | 'storyboarding' | 'completed' | 'failed';
	current_step: number;
	total_steps: number;
	is_anonymous: boolean;
	is_public: boolean;
	public_share_token: string | null;

	// Timestamps
	created_at: string;
	updated_at: string;
	completed_at: string | null;

	// JSONB result fields (legacy, kept for compatibility)
	classification_result: any | null;
	lint_result: any | null;
	storyboard_result: any | null;
	error_message: string | null;

	// ============================================
	// Generated Columns (auto-populated from JSONB)
	// ============================================

	// Overall Scores (0-100 scale)
	deterministic_score: number | null;
	hook_strength: number | null;
	structure_pacing: number | null;
	delivery_performance: number | null;
	value_clarity: number | null;
	lint_score: number | null;
	lint_base_score: number | null;
	lint_bonus_points: number | null;

	// Video Metadata
	video_format: 'talking_head' | 'gameplay' | 'demo' | 'other' | null;
	hook_category: HookCategory | null;
	hook_pattern: string | null;
	niche_category: string | null;
	content_type: string | null;
	target_audience: string | null;

	// Hook Submetrics - Raw Signals
	hook_tt_claim: number | null;          // Time to claim (seconds)
	hook_pb: number | null;                // Pattern break (1-5)
	hook_spec: number | null;              // Specificity count
	hook_qc: number | null;                // Questions/contradictions count

	// Hook Submetrics - Calculated Scores (0-100)
	hook_score_tt_claim: number | null;
	hook_score_pb: number | null;
	hook_score_spec: number | null;
	hook_score_qc: number | null;

	// Structure Submetrics - Raw Signals
	structure_bc: number | null;           // Beat count
	structure_pm: number | null;           // Progress markers
	structure_pp: boolean | null;          // Payoff present
	structure_lc: boolean | null;          // Loop cue

	// Structure Submetrics - Calculated Scores (0-100)
	structure_score_bc: number | null;
	structure_score_pm: number | null;
	structure_score_pp: number | null;
	structure_score_lc: number | null;

	// Clarity Submetrics - Raw Signals
	clarity_word_count: number | null;
	clarity_duration: number | null;       // Seconds
	clarity_sc: number | null;             // Sentence complexity (1-5)
	clarity_tj: number | null;             // Topic jumps
	clarity_rd: number | null;             // Redundancy (1-5)

	// Clarity Submetrics - Calculated Scores (0-100)
	clarity_score_wps: number | null;      // Words per second score
	clarity_score_sc: number | null;
	clarity_score_tj: number | null;
	clarity_score_rd: number | null;

	// Delivery Submetrics - Raw Signals
	delivery_ls: number | null;            // Loudness stability (1-5)
	delivery_ns: number | null;            // Noise/audio quality (1-5)
	delivery_pause_count: number | null;
	delivery_filler_count: number | null;
	delivery_ec: boolean | null;           // Energy curve

	// Delivery Submetrics - Calculated Scores (0-100)
	delivery_score_ls: number | null;
	delivery_score_ns: number | null;
	delivery_score_pq: number | null;      // Pause quality
	delivery_score_ec: number | null;
}

/**
 * Formatted analysis result for API responses
 */
export interface FormattedAnalysisResult {
	id: string;
	title: string;
	videoUrl: string | null;
	fileUri: string | null;
	createdAt: string;
	completedAt: string | null;

	scores: {
		overall: number | null;
		hook: number | null;
		structure: number | null;
		delivery: number | null;
		clarity: number | null;
		lint: number | null;
	};

	metadata: {
		format: string | null;
		hookCategory: HookCategory | null;
		hookPattern: string | null;
		niche: string | null;
		contentType: string | null;
		targetAudience: string | null;
	};

	submetrics: {
		hookTimeToClaim: number | null;
		hookPatternBreak: number | null;
		hookSpecificity: number | null;
		wordsPerSecond: string | null;
		wordsPerSecondScore: number | null;
		wordCount: number | null;
		duration: number | null;
		beatCount: number | null;
		hasPayoff: boolean | null;
		hasLoopCue: boolean | null;
		fillerWordCount: number | null;
		pauseCount: number | null;
	};
}

/**
 * Search query parameters for /api/analyses/search
 */
export interface AnalysisSearchParams {
	// Score filters
	minScore?: number;
	maxScore?: number;
	minHook?: number;
	maxHook?: number;
	minStructure?: number;
	minDelivery?: number;
	minClarity?: number;

	// Metadata filters
	format?: 'talking_head' | 'gameplay' | 'demo' | 'other';
	hookCategory?: HookCategory;
	niche?: string;
	contentType?: string;

	// Submetric filters
	minWPS?: number;
	maxFillerWords?: number;
	maxHookTime?: number;
	hasPayoff?: boolean;
	hasLoopCue?: boolean;

	// Pagination and sorting
	sortBy?: 'deterministic_score' | 'hook_strength' | 'structure_pacing' | 'delivery_performance' |
		'value_clarity' | 'created_at' | 'completed_at' | 'hook_tt_claim' | 'delivery_filler_count' |
		'clarity_score_wps';
	sortOrder?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

/**
 * Search response from /api/analyses/search
 */
export interface AnalysisSearchResponse {
	results: FormattedAnalysisResult[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
}

/**
 * Type guard to check if a score value is valid
 */
export function isValidScore(score: number | null | undefined): score is number {
	return typeof score === 'number' && score >= 0 && score <= 100;
}

/**
 * Type guard to check if analysis job is completed
 */
export function isCompletedAnalysis(job: AnalysisJobRow): boolean {
	return job.status === 'completed' && job.deterministic_score !== null;
}

/**
 * Get letter grade from score (0-100)
 */
export function getLetterGrade(score: number | null | undefined): string {
	if (!isValidScore(score)) return 'N/A';

	if (score >= 90) return 'A';
	if (score >= 80) return 'B';
	if (score >= 70) return 'C';
	if (score >= 60) return 'D';
	return 'F';
}

/**
 * Calculate words per second from raw metrics
 */
export function calculateWordsPerSecond(
	wordCount: number | null,
	duration: number | null
): number | null {
	if (!wordCount || !duration || duration === 0) return null;
	return Math.round((wordCount / duration) * 10) / 10; // Round to 1 decimal
}
