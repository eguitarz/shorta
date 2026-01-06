-- Migration: Create analysis_jobs table for async video analysis
-- Purpose: Store video analysis jobs with step-by-step progress tracking
-- This enables breaking long-running analysis into multiple HTTP requests

-- Create analysis jobs table
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job metadata
  video_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Job created, waiting to start
    'classifying',    -- Step 1 in progress
    'linting',        -- Step 2 in progress
    'storyboarding',  -- Step 3 in progress
    'completed',      -- All steps done
    'failed'          -- Error occurred
  )),

  -- Progress tracking
  current_step INTEGER DEFAULT 0, -- 0=not started, 1=classification done, 2=linting done, 3=all done
  total_steps INTEGER DEFAULT 3,
  error_message TEXT,

  -- Results (stored as JSONB)
  classification_result JSONB,
  lint_result JSONB,
  storyboard_result JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_step_range CHECK (current_step >= 0 AND current_step <= total_steps)
);

-- Indexes for performance
CREATE INDEX idx_analysis_jobs_user_id ON public.analysis_jobs(user_id);
CREATE INDEX idx_analysis_jobs_status ON public.analysis_jobs(status);
CREATE INDEX idx_analysis_jobs_created_at ON public.analysis_jobs(created_at DESC);

-- Row Level Security
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON public.analysis_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON public.analysis_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_analysis_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analysis_jobs_updated_at
  BEFORE UPDATE ON public.analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_jobs_updated_at();
