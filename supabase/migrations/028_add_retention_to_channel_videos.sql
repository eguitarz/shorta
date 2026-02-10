-- Add YouTube Analytics retention metrics to channel_videos
-- These are fetched from YouTube Analytics API (yt-analytics.readonly scope)
-- Nullable because they're only available when the user has granted the analytics scope

ALTER TABLE channel_videos
  ADD COLUMN avg_view_duration_seconds INTEGER,
  ADD COLUMN avg_view_percentage REAL;
