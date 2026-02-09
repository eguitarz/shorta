-- Migration: 018_remove_analyses_from_profiles.sql
-- Purpose: Remove analyses_used/analyses_limit from user_profiles (replaced by storyboard credits)
-- Note: anonymous_usage.analyses_used is kept for free trial tracking
-- Date: 2026-01-27

ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS analyses_used,
DROP COLUMN IF EXISTS analyses_limit;

-- Drop the old function that checked analyses remaining
DROP FUNCTION IF EXISTS has_analyses_remaining(UUID);

-- Update the signup trigger to not set analyses_limit
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
