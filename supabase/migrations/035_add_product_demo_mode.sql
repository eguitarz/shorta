-- Migration: Add Product Demo mode for AI Animation Storyboards
-- Purpose:
--   1. Create the product-assets storage bucket (PRIVATE, RLS-gated).
--   2. Extend the analysis_jobs kind/status enum comments to mention product demo.
-- Notes:
--   - No schema changes to generated_storyboards or analysis_jobs: ProductContext
--     lives inside existing animation_meta + animation_spec JSONB columns.
--   - product_demo arc template is pure application-layer data (arc-templates.ts).
--   - Cascade cleanup for product-assets on storyboard delete follows the same
--     path convention as character-sheets (migration 034): {user_id}/{storyboard_id}/*.

-- ────────────────────────────────────────────────────────────────────────────
-- 1) product-assets bucket (PRIVATE, RLS-gated)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-assets',
  'product-assets',
  false,   -- PRIVATE: served via signed URLs or server-side download, never public.
  4194304, -- 4MB cap per asset (matches upload route validation).
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: user can upload to their own folder ({user_id}/{storyboard_id}/*)
CREATE POLICY "Users can upload product assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own product assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own product assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own product assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 2) Product asset cleanup: cascade on storyboard delete
-- ────────────────────────────────────────────────────────────────────────────

-- When a generated_storyboards row is deleted, remove corresponding
-- product-assets storage objects. Same pattern as character-sheets cleanup
-- (migration 034). We extend the existing cleanup function to handle both
-- buckets in one trigger pass.

CREATE OR REPLACE FUNCTION cleanup_character_sheets_on_storyboard_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- character-sheets: {user_id}/{storyboard_id}/char_{char_id}.png
  DELETE FROM storage.objects
  WHERE bucket_id = 'character-sheets'
    AND name LIKE OLD.user_id::text || '/' || OLD.id::text || '/%';

  -- product-assets: {user_id}/{storyboard_id}/*
  DELETE FROM storage.objects
  WHERE bucket_id = 'product-assets'
    AND name LIKE OLD.user_id::text || '/' || OLD.id::text || '/%';

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger is already installed by migration 034; the function swap above
-- updates behavior without re-creating the trigger.

-- ────────────────────────────────────────────────────────────────────────────
-- 3) animation_meta / animation_spec comment refresh
-- ────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN generated_storyboards.animation_meta IS
  'Animation-mode metadata. NULL for talking_head/demo/vlog/etc. Shape: { logline, tone, styleAnchor, sceneAnchor, arcTemplate, arcCustomDescription?, payoff, characters:[...], productContext?:{ mode, sourceUrl?, productName, headline, subhead?, ctaText, assetPaths[], heroAssetPath, scrapePartial? } }';

COMMENT ON COLUMN analysis_jobs.animation_spec IS
  'Wizard inputs for animation jobs. Shape: { logline, tone, styleAnchor, sceneAnchor, arcTemplate, arcCustomDescription?, payoff, characters:[...], productContext?:{...} }';
