-- Migration: 019_update_tiers_for_new_pricing.sql
-- Purpose: Update user profiles table for the new Stripe pricing model.
-- Date: 2026-02-02

-- Step 1: Drop the old 'tier' check constraint to redefine the allowed tiers.
-- The original constraint was created without a specific name in migration 005.
-- The default name is typically '<table>_<column>_check'. We use IF EXISTS for safety.
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_tier_check;

-- Step 2: Add a new check constraint for the 'tier' column with the new plans.
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_tier_check
CHECK (tier IN (
  'free',      -- Existing free tier for new sign-ups
  'founder',   -- Legacy tier
  'lifetime',  -- Legacy tier
  'hobby',     -- New Hobby Plan
  'pro',       -- New Pro Plan
  'producer'   -- New Producer Plan
));

-- Step 3: Add new columns for the credit-based system.
-- This replaces the old 'analyses_used' and 'analyses_limit' columns removed in migration 018.
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_cap INTEGER NOT NULL DEFAULT 0;

-- Step 4: Add comments for documentation purposes.
COMMENT ON COLUMN public.user_profiles.tier IS 'Subscription tier, supporting both legacy (founder, lifetime) and new (hobby, pro, producer) plans.';
COMMENT ON COLUMN public.user_profiles.credits IS 'Current number of available credits for the user. Deducted upon usage.';
COMMENT ON COLUMN public.user_profiles.credits_cap IS 'The maximum number of credits a user can roll over into the next billing period.';
