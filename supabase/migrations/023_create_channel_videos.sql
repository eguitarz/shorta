-- Migration: Create channel_videos table for synced YouTube channel videos
-- Purpose: Store user's YouTube videos fetched via YouTube Data API
-- Links to analysis_jobs when a video has been analyzed by Shorta

CREATE TABLE IF NOT EXISTS channel_videos (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- YouTube video identifiers
  youtube_video_id TEXT NOT NULL,

  -- Video metadata (from YouTube Data API)
  title TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  is_short BOOLEAN DEFAULT FALSE,

  -- Stats (refreshed on sync)
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,

  -- Link to Shorta analysis (nullable - not all videos are analyzed)
  analysis_job_id UUID REFERENCES analysis_jobs(id) ON DELETE SET NULL,

  -- Timestamps
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One entry per video per user
  CONSTRAINT unique_user_video UNIQUE (user_id, youtube_video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channel_videos_user_id
  ON channel_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_videos_youtube_id
  ON channel_videos(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_channel_videos_analysis_job
  ON channel_videos(analysis_job_id);
CREATE INDEX IF NOT EXISTS idx_channel_videos_is_short
  ON channel_videos(user_id, is_short) WHERE is_short = TRUE;

-- Enable Row Level Security
ALTER TABLE channel_videos ENABLE ROW LEVEL SECURITY;

-- Users can only read their own channel videos
CREATE POLICY "Users can view own channel videos"
  ON channel_videos
  FOR SELECT
  USING (auth.uid() = user_id);
