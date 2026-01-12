-- Migration: 008_add_job_id_to_anonymous_usage.sql
-- Purpose: Store the analysis job_id for anonymous users so they can view their analysis later
-- Date: 2026-01-12

-- Add job_id column to anonymous_usage table
ALTER TABLE public.anonymous_usage
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.analysis_jobs(id) ON DELETE SET NULL;

-- Add index for job_id lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_job_id ON public.anonymous_usage(job_id);

-- Comment on column for documentation
COMMENT ON COLUMN public.anonymous_usage.job_id IS 'The analysis job created by this anonymous user. Used to generate short URL: /try/{job_id}';
