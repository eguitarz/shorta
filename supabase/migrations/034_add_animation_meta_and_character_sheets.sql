-- Migration: Add AI Animation Storyboard mode
-- Purpose: Extend generated_storyboards with animation_meta and analysis_jobs
-- to support 4-step async animation pipeline (story → chars → beats → images).
-- Adds private character-sheets Supabase Storage bucket for internal reference
-- images, with cascade cleanup tied to storyboard lifetime.

-- ────────────────────────────────────────────────────────────────────────────
-- 1) generated_storyboards: add animation_meta jsonb
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE generated_storyboards
  ADD COLUMN IF NOT EXISTS animation_meta JSONB DEFAULT NULL;

COMMENT ON COLUMN generated_storyboards.animation_meta IS
  'Animation-mode metadata. NULL for talking_head/demo/vlog/etc. Shape: { logline, tone, styleAnchor, sceneAnchor, arcTemplate, arcCustomDescription?, payoff, characters:[{ id, name, traits[], personality, sheetPrompt, sheetStoragePath?, sheetGeneratedAt?, sheetFailureReason? }] }';

CREATE INDEX IF NOT EXISTS idx_generated_storyboards_animation
  ON generated_storyboards ((animation_meta IS NOT NULL))
  WHERE animation_meta IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 2) analysis_jobs: add kind + animation_spec + extend status enum
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE analysis_jobs
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'analysis';

ALTER TABLE analysis_jobs
  ADD COLUMN IF NOT EXISTS animation_spec JSONB DEFAULT NULL;

-- kind values we support. CHECK so we fail loud on typos.
ALTER TABLE analysis_jobs
  DROP CONSTRAINT IF EXISTS analysis_jobs_kind_check;
ALTER TABLE analysis_jobs
  ADD CONSTRAINT analysis_jobs_kind_check
  CHECK (kind IN ('analysis', 'animation'));

-- Extend the existing status enum to cover the 4-step animation pipeline.
-- Postgres has no ALTER CHECK in place; drop + re-add with the superset.
ALTER TABLE analysis_jobs
  DROP CONSTRAINT IF EXISTS analysis_jobs_status_check;
ALTER TABLE analysis_jobs
  ADD CONSTRAINT analysis_jobs_status_check
  CHECK (status IN (
    -- Existing analyzer statuses (preserved verbatim)
    'pending',
    'classifying',
    'linting',
    'storyboarding',
    'completed',
    'failed',
    -- New animation pipeline statuses
    'story_complete',     -- Pass 1 finished; animation_meta populated
    'chars_complete',     -- All character sheets generated
    'chars_partial',      -- Some sheets failed; text pipeline proceeds anyway
    'beats_complete',     -- Pass 2 finished; user can view + export text immediately
    'images_partial',     -- Some beat images failed or still retrying
    'capped',             -- MAX_CREDITS_PER_ANIMATION_JOB hit; partial output delivered
    'stale'               -- Watchdog: job stuck > 10 min in processing state
  ));

COMMENT ON COLUMN analysis_jobs.kind IS
  'Job type: analysis (default, video analysis) or animation (AI animation storyboard)';
COMMENT ON COLUMN analysis_jobs.animation_spec IS
  'Wizard inputs for animation jobs. Shape: { logline, tone, styleAnchor, sceneAnchor, arcTemplate, arcCustomDescription?, payoff, characters:[{ name, traits[], personality }] }';

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_kind
  ON analysis_jobs(kind)
  WHERE kind = 'animation';

-- Update total_steps bounds for animation jobs (4 steps vs. analysis 3 steps).
-- The existing CHECK (current_step >= 0 AND current_step <= total_steps) already
-- handles this dynamically, so no schema change needed.

-- ────────────────────────────────────────────────────────────────────────────
-- 3) character-sheets bucket (PRIVATE, RLS-gated)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-sheets',
  'character-sheets',
  false,  -- PRIVATE: user's explicit spec. Served via signed URLs, never public.
  5242880, -- 5MB cap per sheet (same as storyboard-images)
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: user can upload to their own folder ({user_id}/{storyboard_id}/*)
CREATE POLICY "Users can upload character sheets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'character-sheets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own character sheets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'character-sheets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own character sheets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'character-sheets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Private bucket: explicit SELECT policy required (no public read).
CREATE POLICY "Users can read own character sheets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'character-sheets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 4) update_animation_meta RPC: atomic jsonb merge
-- ────────────────────────────────────────────────────────────────────────────

-- Mirrors update_beat_image pattern from migration 033. Atomic merge of
-- top-level animation_meta fields; callers patch ALL fields they want to update
-- in a single RPC call. For nested character updates, callers send
-- { characters: [... full array ...] } since top-level || merge would replace
-- the whole characters array anyway.

CREATE OR REPLACE FUNCTION update_animation_meta(
  p_storyboard_id UUID,
  p_patch JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE generated_storyboards
  SET animation_meta = COALESCE(animation_meta, '{}'::jsonb) || p_patch
  WHERE id = p_storyboard_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_animation_meta IS
  'Atomic top-level jsonb merge for animation_meta. Use for progressive updates from the animation pipeline (Pass 1 → chars → beats). Caller must RLS-authorize via auth.uid().';

-- ────────────────────────────────────────────────────────────────────────────
-- 5) Character sheet cleanup: cascade on storyboard delete
-- ────────────────────────────────────────────────────────────────────────────

-- When a generated_storyboards row is deleted, remove the corresponding
-- character-sheets storage objects. Supabase Storage objects aren't managed
-- by Postgres FK cascade; use a trigger to delete matching paths.

CREATE OR REPLACE FUNCTION cleanup_character_sheets_on_storyboard_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Sheet paths follow the convention: {user_id}/{storyboard_id}/char_{char_id}.png
  DELETE FROM storage.objects
  WHERE bucket_id = 'character-sheets'
    AND name LIKE OLD.user_id::text || '/' || OLD.id::text || '/%';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS generated_storyboards_cleanup_sheets
  ON generated_storyboards;
CREATE TRIGGER generated_storyboards_cleanup_sheets
  BEFORE DELETE ON generated_storyboards
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_character_sheets_on_storyboard_delete();

-- ────────────────────────────────────────────────────────────────────────────
-- 6) Job watchdog (critical gap from eng review): mark stale jobs
-- ────────────────────────────────────────────────────────────────────────────

-- Any analysis_jobs row stuck in a processing state > 10 minutes is marked
-- 'stale' so the UI can surface it and allow user retry. Runs hourly via
-- pg_cron.

CREATE OR REPLACE FUNCTION mark_stale_jobs()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE analysis_jobs
  SET status = 'stale',
      error_message = COALESCE(error_message, '') ||
        CASE WHEN error_message IS NOT NULL AND error_message != '' THEN ' | ' ELSE '' END ||
        'Watchdog: stuck > 10 min in ' || status || ' state',
      updated_at = NOW()
  WHERE status IN (
    'classifying', 'linting', 'storyboarding',
    'story_complete', 'chars_complete', 'chars_partial',
    'beats_complete', 'images_partial'
  )
    AND updated_at < NOW() - INTERVAL '10 minutes';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_stale_jobs IS
  'Watchdog: mark analysis_jobs stuck > 10 min in any processing state as stale. Scheduled hourly via pg_cron.';

-- pg_cron scheduling (idempotent): hourly watchdog pass
-- Requires pg_cron extension; enable once in the Supabase dashboard:
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Then unschedule any prior entry by name and reschedule:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('animation-watchdog-hourly')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'animation-watchdog-hourly');

    PERFORM cron.schedule(
      'animation-watchdog-hourly',
      '0 * * * *',
      $CRON$SELECT mark_stale_jobs();$CRON$
    );
  ELSE
    RAISE NOTICE 'pg_cron extension not installed. Enable it in Supabase dashboard, then re-run this migration block. Watchdog will not run until then.';
  END IF;
END $$;
