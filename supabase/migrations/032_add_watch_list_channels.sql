-- Watch list: user-curated channels for custom trends (paid users only, max 10)
CREATE TABLE public.watch_list_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  channel_thumbnail TEXT,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, channel_id)
);

ALTER TABLE public.watch_list_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_watch_list"
  ON public.watch_list_channels
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_watch_list_user ON public.watch_list_channels (user_id);
