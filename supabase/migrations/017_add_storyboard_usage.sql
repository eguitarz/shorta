-- Migration: 017_add_storyboard_usage.sql
-- Purpose: Add monthly storyboard usage tracking for paid tiers (50/month, resets on 1st)
-- Date: 2026-01-27

-- Add storyboard usage columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS storyboards_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS storyboards_limit INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS storyboards_reset_at TIMESTAMP WITH TIME ZONE;

-- Function: Reset storyboard usage if the reset date has passed
CREATE OR REPLACE FUNCTION reset_storyboard_usage_if_needed(p_user_id UUID)
RETURNS TABLE(
  storyboards_used INTEGER,
  storyboards_limit INTEGER,
  storyboards_reset_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_reset_at TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_next_reset TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT up.storyboards_reset_at INTO v_reset_at
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  -- Calculate next 1st of month at midnight UTC
  v_next_reset := date_trunc('month', v_now) + INTERVAL '1 month';

  -- Reset if never set or if reset date has passed
  IF v_reset_at IS NULL OR v_now >= v_reset_at THEN
    UPDATE public.user_profiles
    SET storyboards_used = 0,
        storyboards_reset_at = v_next_reset
    WHERE user_id = p_user_id;
  END IF;

  RETURN QUERY
  SELECT up.storyboards_used, up.storyboards_limit, up.storyboards_reset_at
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment storyboard usage (resets first if needed)
CREATE OR REPLACE FUNCTION increment_storyboard_usage(p_user_id UUID)
RETURNS TABLE(
  storyboards_used INTEGER,
  storyboards_limit INTEGER,
  storyboards_reset_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Reset if needed first
  PERFORM reset_storyboard_usage_if_needed(p_user_id);

  -- Increment
  UPDATE public.user_profiles
  SET storyboards_used = public.user_profiles.storyboards_used + 1
  WHERE user_id = p_user_id;

  RETURN QUERY
  SELECT up.storyboards_used, up.storyboards_limit, up.storyboards_reset_at
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_storyboard_usage_if_needed IS 'Reset storyboard usage counter if the monthly reset date has passed';
COMMENT ON FUNCTION increment_storyboard_usage IS 'Increment storyboard usage (auto-resets if month has passed)';
