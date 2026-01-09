-- Migration: Add public sharing for analysis results
-- Purpose: Enable users to share analysis results via permanent public links

-- Add is_public column to analysis_jobs table
ALTER TABLE public.analysis_jobs
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Index for public queries (partial index for better performance)
CREATE INDEX idx_analysis_jobs_is_public
ON public.analysis_jobs(is_public)
WHERE is_public = TRUE;

-- Comment on column for documentation
COMMENT ON COLUMN public.analysis_jobs.is_public IS 'When true, this analysis can be viewed by anyone with the job_id link, without authentication';
