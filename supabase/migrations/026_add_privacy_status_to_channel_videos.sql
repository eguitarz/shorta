-- Add privacy_status column to channel_videos
-- Values: 'public', 'unlisted', 'private'
ALTER TABLE channel_videos
  ADD COLUMN IF NOT EXISTS privacy_status TEXT DEFAULT 'public';
