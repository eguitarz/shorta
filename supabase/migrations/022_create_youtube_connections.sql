-- Migration: Create youtube_connections table for YouTube OAuth2 integration
-- Purpose: Store encrypted OAuth tokens and channel info for YouTube Connect feature
-- Tokens are encrypted with AES-256-GCM before storage; only service role can write

CREATE TABLE IF NOT EXISTS youtube_connections (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key: one connection per user
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel info (public, shown in UI)
  channel_id TEXT NOT NULL,
  channel_title TEXT,
  channel_thumbnail_url TEXT,
  subscriber_count INTEGER,
  video_count INTEGER,

  -- Encrypted OAuth tokens (never exposed to client)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Connection status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',        -- Connected and working
    'needs_reauth',  -- Token refresh failed, user needs to reconnect
    'disconnected'   -- User disconnected
  )),

  -- Sync metadata
  last_video_sync_at TIMESTAMPTZ,

  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_youtube_connections_user_id
  ON youtube_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_connections_channel_id
  ON youtube_connections(channel_id);

-- Enable Row Level Security
ALTER TABLE youtube_connections ENABLE ROW LEVEL SECURITY;

-- Users can only read their own connection
CREATE POLICY "Users can view own youtube connection"
  ON youtube_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE restricted to service role only
-- (tokens are sensitive and must be handled server-side)
