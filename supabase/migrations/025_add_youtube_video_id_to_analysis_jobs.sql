-- Migration: Add youtube_video_id column to analysis_jobs
-- Purpose: Enable matching analysis jobs to channel_videos by YouTube video ID
-- Extracted from video_url during job creation

ALTER TABLE analysis_jobs
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;

-- Partial index: only index rows where youtube_video_id is set
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_youtube_video_id
  ON analysis_jobs(youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;
