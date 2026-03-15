-- Add is_public column to analysis_jobs for shareable analysis reports
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast lookups when serving public shared reports
CREATE INDEX IF NOT EXISTS analysis_jobs_is_public_idx ON analysis_jobs (is_public) WHERE is_public = TRUE;
