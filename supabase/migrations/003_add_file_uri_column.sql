-- Migration: Add file_uri column for uploaded video support
-- Purpose: Store Gemini File API URI for uploaded videos (as alternative to video_url for YouTube)

-- Add file_uri column to analysis_jobs table
ALTER TABLE public.analysis_jobs
ADD COLUMN file_uri TEXT;

-- Make video_url nullable since we now support either video_url OR file_uri
ALTER TABLE public.analysis_jobs
ALTER COLUMN video_url DROP NOT NULL;

-- Add constraint to ensure at least one video source exists
ALTER TABLE public.analysis_jobs
ADD CONSTRAINT video_source_required
CHECK (video_url IS NOT NULL OR file_uri IS NOT NULL);

-- Comment on column for documentation
COMMENT ON COLUMN public.analysis_jobs.file_uri IS 'Gemini File API URI for uploaded videos. Either this or video_url must be set.';
COMMENT ON COLUMN public.analysis_jobs.video_url IS 'YouTube video URL. Either this or file_uri must be set.';
