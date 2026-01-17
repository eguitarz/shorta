-- Migration: Add video_duration column for token optimization
-- Purpose: Store video duration at job creation to optimize FPS for long videos

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS
  video_duration INTEGER;

COMMENT ON COLUMN analysis_jobs.video_duration IS 'Video duration in seconds, used to optimize analysis FPS for long videos';

-- Index for filtering by duration
CREATE INDEX IF NOT EXISTS idx_jobs_video_duration ON analysis_jobs(video_duration) WHERE video_duration IS NOT NULL;
