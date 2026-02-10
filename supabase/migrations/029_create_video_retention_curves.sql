-- Per-video audience retention curve cache
-- Stores YouTube Analytics elapsedVideoTimeRatio data with 24h TTL

CREATE TABLE IF NOT EXISTS video_retention_curves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  curve_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, youtube_video_id)
);

-- Index for fast lookups by user + video
CREATE INDEX idx_video_retention_curves_user_video
  ON video_retention_curves (user_id, youtube_video_id);

-- RLS: users can SELECT their own rows; writes via service role
ALTER TABLE video_retention_curves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own retention curves"
  ON video_retention_curves FOR SELECT
  USING (auth.uid() = user_id);
