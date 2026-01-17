-- Migration: Add generated columns for scores and submetrics
-- Purpose: Enable fast sorting, filtering, and searching on all score metrics
-- Strategy: Use GENERATED ALWAYS AS STORED columns to auto-populate from JSONB

-- ============================================
-- 1. Overall Scores (0-100 scale)
-- ============================================

-- Total deterministic score
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  deterministic_score INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->>'_deterministicScore')::INTEGER
  ) STORED;

-- Category scores
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_strength INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'performance'->>'hookStrength')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_pacing INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'performance'->>'structurePacing')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_performance INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'performance'->>'deliveryPerformance')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  value_clarity INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'performance'->'content'->>'valueClarity')::INTEGER
  ) STORED;

-- Lint scores
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  lint_score INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'lintSummary'->>'score')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  lint_base_score INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'lintSummary'->>'baseScore')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  lint_bonus_points INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'lintSummary'->>'bonusPoints')::INTEGER
  ) STORED;

-- ============================================
-- 2. Video Metadata
-- ============================================

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  video_format TEXT GENERATED ALWAYS AS (
    storyboard_result->'storyboard'->>'_format'
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_category TEXT GENERATED ALWAYS AS (
    storyboard_result->'storyboard'->'overview'->>'hookCategory'
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_pattern TEXT GENERATED ALWAYS AS (
    storyboard_result->'storyboard'->'overview'->>'hookPattern'
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  niche_category TEXT GENERATED ALWAYS AS (
    storyboard_result->'storyboard'->'overview'->>'nicheCategory'
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  content_type TEXT GENERATED ALWAYS AS (
    storyboard_result->'storyboard'->'overview'->>'contentType'
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  target_audience TEXT GENERATED ALWAYS AS (
    storyboard_result->'storyboard'->'overview'->>'targetAudience'
  ) STORED;

-- ============================================
-- 3. Hook Submetrics - Raw Signals
-- ============================================

-- Time to claim (seconds until first value proposition)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_tt_claim NUMERIC GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'hook'->>'TTClaim')::NUMERIC
  ) STORED;

-- Pattern break (1-5 scale for energy variation)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_pb INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'hook'->>'PB')::INTEGER
  ) STORED;

-- Specificity count (numbers, timeframes, costs, proper nouns)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_spec INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'hook'->>'Spec')::INTEGER
  ) STORED;

-- Questions/contradictions count
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_qc INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'hook'->>'QC')::INTEGER
  ) STORED;

-- ============================================
-- 4. Hook Submetrics - Calculated Scores (0-100)
-- ============================================

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_score_tt_claim INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'hook'->>'TTClaim')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_score_pb INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'hook'->>'PB')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_score_spec INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'hook'->>'Spec')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  hook_score_qc INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'hook'->>'QC')::INTEGER
  ) STORED;

-- ============================================
-- 5. Structure Submetrics - Raw Signals
-- ============================================

-- Beat count
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_bc INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'structure'->>'BC')::INTEGER
  ) STORED;

-- Progress markers count
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_pm INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'structure'->>'PM')::INTEGER
  ) STORED;

-- Payoff present (boolean)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_pp BOOLEAN GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'structure'->>'PP')::BOOLEAN
  ) STORED;

-- Loop cue (boolean)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_lc BOOLEAN GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'structure'->>'LC')::BOOLEAN
  ) STORED;

-- ============================================
-- 6. Structure Submetrics - Calculated Scores (0-100)
-- ============================================

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_score_bc INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'structure'->>'BC')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_score_pm INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'structure'->>'PM')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_score_pp INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'structure'->>'PP')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  structure_score_lc INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'structure'->>'LC')::INTEGER
  ) STORED;

-- ============================================
-- 7. Clarity Submetrics - Raw Signals
-- ============================================

-- Word count
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_word_count INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'clarity'->>'wordCount')::INTEGER
  ) STORED;

-- Duration (seconds)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_duration NUMERIC GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'clarity'->>'duration')::NUMERIC
  ) STORED;

-- Sentence complexity (1-5)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_sc INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'clarity'->>'SC')::INTEGER
  ) STORED;

-- Topic jumps
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_tj INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'clarity'->>'TJ')::INTEGER
  ) STORED;

-- Redundancy (1-5)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_rd INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'clarity'->>'RD')::INTEGER
  ) STORED;

-- ============================================
-- 8. Clarity Submetrics - Calculated Scores (0-100)
-- ============================================

-- Words per second score
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_score_wps INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'clarity'->>'WPS')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_score_sc INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'clarity'->>'SC')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_score_tj INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'clarity'->>'TJ')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  clarity_score_rd INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'clarity'->>'RD')::INTEGER
  ) STORED;

-- ============================================
-- 9. Delivery Submetrics - Raw Signals
-- ============================================

-- Loudness stability (1-5)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_ls INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'delivery'->>'LS')::INTEGER
  ) STORED;

-- Noise/audio quality (1-5)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_ns INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'delivery'->>'NS')::INTEGER
  ) STORED;

-- Pause count
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_pause_count INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'delivery'->>'pauseCount')::INTEGER
  ) STORED;

-- Filler word count
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_filler_count INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'delivery'->>'fillerCount')::INTEGER
  ) STORED;

-- Energy curve (boolean)
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_ec BOOLEAN GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_signals'->'delivery'->>'EC')::BOOLEAN
  ) STORED;

-- ============================================
-- 10. Delivery Submetrics - Calculated Scores (0-100)
-- ============================================

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_score_ls INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'delivery'->>'LS')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_score_ns INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'delivery'->>'NS')::INTEGER
  ) STORED;

-- Pause quality
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_score_pq INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'delivery'->>'PQ')::INTEGER
  ) STORED;

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  delivery_score_ec INTEGER GENERATED ALWAYS AS (
    (storyboard_result->'storyboard'->'_scoreBreakdown'->'delivery'->>'EC')::INTEGER
  ) STORED;

-- ============================================
-- 11. Indexes for Common Queries
-- ============================================

-- Overall scores (most commonly filtered)
CREATE INDEX IF NOT EXISTS idx_jobs_deterministic_score ON analysis_jobs(deterministic_score) WHERE deterministic_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_hook_strength ON analysis_jobs(hook_strength) WHERE hook_strength IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_structure_pacing ON analysis_jobs(structure_pacing) WHERE structure_pacing IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_delivery_performance ON analysis_jobs(delivery_performance) WHERE delivery_performance IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_value_clarity ON analysis_jobs(value_clarity) WHERE value_clarity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_lint_score ON analysis_jobs(lint_score) WHERE lint_score IS NOT NULL;

-- Video metadata (for filtering by format, hook type, etc.)
CREATE INDEX IF NOT EXISTS idx_jobs_video_format ON analysis_jobs(video_format) WHERE video_format IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_hook_category ON analysis_jobs(hook_category) WHERE hook_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_niche_category ON analysis_jobs(niche_category) WHERE niche_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_content_type ON analysis_jobs(content_type) WHERE content_type IS NOT NULL;

-- Hook submetrics (for granular searches)
CREATE INDEX IF NOT EXISTS idx_jobs_hook_tt_claim ON analysis_jobs(hook_tt_claim) WHERE hook_tt_claim IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_hook_pb ON analysis_jobs(hook_pb) WHERE hook_pb IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_hook_spec ON analysis_jobs(hook_spec) WHERE hook_spec IS NOT NULL;

-- Clarity submetrics (words per second is commonly searched)
CREATE INDEX IF NOT EXISTS idx_jobs_clarity_wps ON analysis_jobs(clarity_score_wps) WHERE clarity_score_wps IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_clarity_word_count ON analysis_jobs(clarity_word_count) WHERE clarity_word_count IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_clarity_duration ON analysis_jobs(clarity_duration) WHERE clarity_duration IS NOT NULL;

-- Structure submetrics
CREATE INDEX IF NOT EXISTS idx_jobs_structure_bc ON analysis_jobs(structure_bc) WHERE structure_bc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_structure_pp ON analysis_jobs(structure_pp) WHERE structure_pp IS NOT NULL;

-- Delivery submetrics
CREATE INDEX IF NOT EXISTS idx_jobs_delivery_filler_count ON analysis_jobs(delivery_filler_count) WHERE delivery_filler_count IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_delivery_pause_count ON analysis_jobs(delivery_pause_count) WHERE delivery_pause_count IS NOT NULL;

-- Composite indexes for common multi-criteria queries
CREATE INDEX IF NOT EXISTS idx_jobs_format_score ON analysis_jobs(video_format, deterministic_score)
  WHERE video_format IS NOT NULL AND deterministic_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_hook_category_strength ON analysis_jobs(hook_category, hook_strength)
  WHERE hook_category IS NOT NULL AND hook_strength IS NOT NULL;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON COLUMN analysis_jobs.deterministic_score IS 'Overall video score (0-100), calculated from weighted category scores';
COMMENT ON COLUMN analysis_jobs.hook_strength IS 'Hook category score (0-100)';
COMMENT ON COLUMN analysis_jobs.structure_pacing IS 'Structure category score (0-100)';
COMMENT ON COLUMN analysis_jobs.delivery_performance IS 'Delivery category score (0-100)';
COMMENT ON COLUMN analysis_jobs.value_clarity IS 'Clarity category score (0-100)';
COMMENT ON COLUMN analysis_jobs.video_format IS 'Video format: talking_head, gameplay, or other';
COMMENT ON COLUMN analysis_jobs.hook_category IS 'Dominant hook type detected (e.g., premise, visual, conflict)';
COMMENT ON COLUMN analysis_jobs.hook_tt_claim IS 'Time to claim in seconds (lower is better)';
COMMENT ON COLUMN analysis_jobs.hook_pb IS 'Pattern break score (1-5 scale for energy variation)';
COMMENT ON COLUMN analysis_jobs.hook_spec IS 'Specificity count (numbers, timeframes, costs, proper nouns)';
COMMENT ON COLUMN analysis_jobs.clarity_word_count IS 'Total word count in transcript';
COMMENT ON COLUMN analysis_jobs.clarity_duration IS 'Video duration in seconds';
COMMENT ON COLUMN analysis_jobs.clarity_score_wps IS 'Words per second score (0-100, ideal: 3-4 WPS)';
COMMENT ON COLUMN analysis_jobs.delivery_filler_count IS 'Count of filler words (um, uh, like, you know)';
COMMENT ON COLUMN analysis_jobs.delivery_pause_count IS 'Count of deliberate pauses for effect';
