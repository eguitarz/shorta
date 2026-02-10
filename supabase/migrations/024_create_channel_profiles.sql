-- Migration: Create channel_profiles table for niche detection results
-- Purpose: Store AI-detected niche, content themes, and channel statistics
-- Populated by Gemini analysis of channel video titles/descriptions

CREATE TABLE IF NOT EXISTS channel_profiles (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key: one profile per user
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Niche detection results
  primary_niche TEXT,
  secondary_niches TEXT[] DEFAULT '{}',
  niche_confidence REAL,        -- 0.0 to 1.0
  niche_reasoning TEXT,          -- AI explanation of niche detection

  -- Channel characteristics
  primary_format TEXT,           -- talking_head, gameplay, vlog, tutorial, other
  target_audience TEXT,
  content_themes TEXT[] DEFAULT '{}',

  -- Performance summary (aggregated from channel_videos + analysis_jobs)
  avg_view_count INTEGER,
  avg_engagement_rate REAL,
  total_videos_analyzed INTEGER DEFAULT 0,
  avg_shorta_score INTEGER,

  -- Timestamps
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE channel_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own channel profile
CREATE POLICY "Users can view own channel profile"
  ON channel_profiles
  FOR SELECT
  USING (auth.uid() = user_id);
