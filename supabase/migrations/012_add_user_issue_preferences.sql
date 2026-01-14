-- Migration: 012_add_user_issue_preferences.sql
-- Purpose: Store user preferences for issue severity levels (preference learning)
-- Date: 2026-01-14

-- Create user_issue_preferences table
CREATE TABLE IF NOT EXISTS public.user_issue_preferences (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to auth.users
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Issue identifier
  -- For linter rules: use ruleId (e.g., 'th_hook_timing')
  -- For AI-discovered issues: use hash of message (e.g., 'ai_<hash>')
  issue_key TEXT NOT NULL,

  -- User's preferred severity
  -- 'critical' (-10), 'moderate' (-5), 'minor' (-2), 'ignored' (0)
  severity TEXT NOT NULL CHECK (severity IN (
    'critical',
    'moderate',
    'minor',
    'ignored'
  )),

  -- Original severity (for reference/reset)
  original_severity TEXT NOT NULL CHECK (original_severity IN (
    'critical',
    'moderate',
    'minor'
  )),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one preference per user per issue
  CONSTRAINT unique_user_issue UNIQUE (user_id, issue_key)
);

-- Indexes for performance
CREATE INDEX idx_user_issue_preferences_user_id ON public.user_issue_preferences(user_id);
CREATE INDEX idx_user_issue_preferences_issue_key ON public.user_issue_preferences(issue_key);

-- Row Level Security
ALTER TABLE public.user_issue_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_issue_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
  ON public.user_issue_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_issue_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.user_issue_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_issue_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_issue_preferences_updated_at
  BEFORE UPDATE ON public.user_issue_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_issue_preferences_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.user_issue_preferences IS 'Stores user preferences for issue severity levels';
COMMENT ON COLUMN public.user_issue_preferences.issue_key IS 'ruleId for linter rules, or ai_<hash> for AI-discovered issues';
COMMENT ON COLUMN public.user_issue_preferences.severity IS 'User preferred severity: critical (-10), moderate (-5), minor (-2), ignored (0)';
