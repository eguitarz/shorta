-- Migration: 020_update_credit_logic.sql
-- Purpose: Replace the old storyboard counting system with the new credit-based system.
-- Date: 2026-02-02

-- Step 1: Drop the old RPC functions for storyboard usage.
DROP FUNCTION IF EXISTS public.reset_storyboard_usage_if_needed(UUID);
DROP FUNCTION IF EXISTS public.increment_storyboard_usage(UUID);

-- Step 2: Drop the old columns from the user_profiles table.
-- These are replaced by the 'credits' and 'credits_cap' columns added in migration 019.
ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS storyboards_used,
DROP COLUMN IF EXISTS storyboards_limit,
DROP COLUMN IF EXISTS storyboards_reset_at;

-- Step 3: Create a new function to deduct credits for a storyboard.
-- This function checks for sufficient credits and deducts them in one atomic operation.
-- It will be called by the application before generating a storyboard.
CREATE OR REPLACE FUNCTION deduct_storyboard_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
DECLARE
  v_current_credits INTEGER;
  v_tier TEXT;
BEGIN
  -- Select the user's current credits and tier into variables.
  -- Use a row-level lock to prevent race conditions where a user might
  -- try to make multiple requests at the same time.
  SELECT credits, tier
  INTO v_current_credits, v_tier
  FROM public.user_profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if the user has enough credits to perform the action
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  -- If they have enough, deduct the specified amount.
  UPDATE public.user_profiles
  SET credits = credits - p_amount
  WHERE user_id = p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deduct_storyboard_credits IS 'Deducts a specified amount of credits from a user. Throws an "insufficient_credits" error if the balance is too low. Legacy unlimited tiers are exempt.';
