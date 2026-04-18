-- Migration: Relax video_source_required constraint for animation jobs
-- Purpose: Animation storyboard jobs (kind='animation') have no source video.
-- The existing constraint from migration 003 requires one of video_url or
-- file_uri. Relax it to: either kind='animation' OR at least one source.

ALTER TABLE public.analysis_jobs
  DROP CONSTRAINT IF EXISTS video_source_required;

ALTER TABLE public.analysis_jobs
  ADD CONSTRAINT video_source_required
  CHECK (
    kind = 'animation'
    OR video_url IS NOT NULL
    OR file_uri IS NOT NULL
  );

COMMENT ON CONSTRAINT video_source_required ON public.analysis_jobs IS
  'Analysis jobs need a video source (URL or file); animation jobs (kind=animation) are exempt.';
