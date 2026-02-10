-- Channel stats snapshots for week-over-week tracking
CREATE TABLE channel_stats_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  video_count INTEGER NOT NULL DEFAULT 0,
  total_views BIGINT NOT NULL DEFAULT 0,
  total_shorts_count INTEGER NOT NULL DEFAULT 0,
  avg_short_views INTEGER,
  avg_short_likes INTEGER,
  avg_short_comments INTEGER,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_snapshot_date UNIQUE (user_id, snapshot_date)
);

CREATE INDEX idx_channel_stats_user_date
  ON channel_stats_snapshots(user_id, snapshot_date DESC);

ALTER TABLE channel_stats_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channel stats snapshots"
  ON channel_stats_snapshots FOR SELECT USING (auth.uid() = user_id);
