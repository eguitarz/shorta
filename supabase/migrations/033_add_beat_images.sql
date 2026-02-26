-- Migration: Add beat_images to generated_storyboards
-- Purpose: Store generated image URLs per beat for storyboard visualization

-- Add beat_images column to store generated image URLs per beat
ALTER TABLE generated_storyboards
ADD COLUMN IF NOT EXISTS beat_images JSONB DEFAULT '{}';

-- Add UPDATE policy (currently missing - needed for saving images after storyboard creation)
CREATE POLICY "Users can update own storyboards"
  ON public.generated_storyboards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to atomically update a single beat's image without overwriting others
CREATE OR REPLACE FUNCTION update_beat_image(
  p_storyboard_id UUID,
  p_beat_number TEXT,
  p_image_data JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE generated_storyboards
  SET beat_images = COALESCE(beat_images, '{}'::jsonb) || jsonb_build_object(p_beat_number, p_image_data)
  WHERE id = p_storyboard_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for storyboard images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'storyboard-images',
  'storyboard-images',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can upload to their own folder
CREATE POLICY "Users can upload storyboard images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'storyboard-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies: users can update (overwrite) their own images
CREATE POLICY "Users can update own storyboard images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'storyboard-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies: users can delete their own images
CREATE POLICY "Users can delete own storyboard images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'storyboard-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies: public read access
CREATE POLICY "Public read storyboard images"
ON storage.objects FOR SELECT
USING (bucket_id = 'storyboard-images');

COMMENT ON COLUMN generated_storyboards.beat_images IS
  'Map of beatNumber -> image metadata: { "1": { "url": "...", "storagePath": "...", "prompt": "...", "generatedAt": "..." }, ... }';
