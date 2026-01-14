-- Migration: Create generated_storyboards table
-- Purpose: Store generated storyboards with AI-searchable metadata for performance comparison
-- Links to analysis_jobs to track which analysis each storyboard was generated from

-- Create generated_storyboards table
CREATE TABLE IF NOT EXISTS public.generated_storyboards (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_job_id UUID NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,

  -- Title for display in activities
  title TEXT NOT NULL,

  -- Original analysis data (for reference)
  original_overview JSONB,
  original_beats JSONB,

  -- Generated storyboard data
  generated_overview JSONB NOT NULL,
  generated_beats JSONB NOT NULL,

  -- Changes that were applied (for AI analysis)
  applied_changes JSONB,

  -- Searchable metadata extracted for AI performance comparison
  niche_category TEXT,           -- e.g., "Tech", "Lifestyle"
  content_type TEXT,             -- e.g., "Tutorial", "Story"
  hook_pattern TEXT,             -- e.g., "Question", "Statement"
  video_length_seconds INTEGER,  -- Duration
  changes_count INTEGER,         -- Number of applied fixes/variants

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for AI search and performance comparison
CREATE INDEX idx_generated_storyboards_user_id ON public.generated_storyboards(user_id);
CREATE INDEX idx_generated_storyboards_analysis_job_id ON public.generated_storyboards(analysis_job_id);
CREATE INDEX idx_generated_storyboards_niche ON public.generated_storyboards(niche_category);
CREATE INDEX idx_generated_storyboards_content_type ON public.generated_storyboards(content_type);
CREATE INDEX idx_generated_storyboards_created_at ON public.generated_storyboards(created_at DESC);

-- Row Level Security
ALTER TABLE public.generated_storyboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storyboards"
  ON public.generated_storyboards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own storyboards"
  ON public.generated_storyboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own storyboards"
  ON public.generated_storyboards FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_generated_storyboards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generated_storyboards_updated_at
  BEFORE UPDATE ON public.generated_storyboards
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_storyboards_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.generated_storyboards IS 'Stores AI-generated director storyboards derived from video analysis';
COMMENT ON COLUMN public.generated_storyboards.analysis_job_id IS 'Reference to the source analysis job';
COMMENT ON COLUMN public.generated_storyboards.niche_category IS 'Extracted for AI search - e.g., Tech, Lifestyle, Education';
COMMENT ON COLUMN public.generated_storyboards.content_type IS 'Extracted for AI search - e.g., Tutorial, Story, Review';
COMMENT ON COLUMN public.generated_storyboards.hook_pattern IS 'Extracted for AI search - e.g., Question, Statement, Revelation';
COMMENT ON COLUMN public.generated_storyboards.changes_count IS 'Number of user-approved changes applied during generation';
