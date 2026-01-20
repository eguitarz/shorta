-- Migration: Add starred and title columns for Library feature
-- Purpose: Enable starring videos for knowledge base and display titles in library

-- Add starred column
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  starred BOOLEAN DEFAULT FALSE;

-- Add title as generated column from JSONB
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  title TEXT GENERATED ALWAYS AS (
    storyboard_result->'storyboard'->'overview'->>'title'
  ) STORED;

-- Index for starred filter (partial index for better performance)
CREATE INDEX IF NOT EXISTS idx_jobs_starred ON analysis_jobs(starred) WHERE starred = TRUE;

-- Index for title search
CREATE INDEX IF NOT EXISTS idx_jobs_title ON analysis_jobs(title) WHERE title IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN analysis_jobs.starred IS 'User-starred videos for knowledge base. Starred videos inform AI generation in Draft mode.';
COMMENT ON COLUMN analysis_jobs.title IS 'Video title extracted from analysis. Auto-generated from storyboard_result JSONB.';
