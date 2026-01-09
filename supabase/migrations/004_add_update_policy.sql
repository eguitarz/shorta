-- Migration: Add UPDATE policy for analysis_jobs
-- Purpose: Allow users to update their own jobs (needed for sharing feature)

-- Add UPDATE policy so users can update their own jobs
CREATE POLICY "Users can update own jobs"
  ON public.analysis_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON POLICY "Users can update own jobs" ON public.analysis_jobs IS 'Allows users to update their own analysis jobs, including setting is_public for sharing';
