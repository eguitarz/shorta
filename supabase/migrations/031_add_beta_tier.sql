-- Migration: 031_add_beta_tier.sql
-- Purpose: Add 'beta' tier for early beta users. Same features as 'pro' but
--          credits are one-time (no monthly reset). Once used up, they must upgrade.
-- Date: 2026-02-14

-- Step 1: Drop the existing tier check constraint.
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_tier_check;

-- Step 2: Re-add the constraint with the new 'beta' tier included.
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_tier_check
CHECK (tier IN (
  'free',
  'founder',
  'lifetime',
  'hobby',
  'pro',
  'producer',
  'beta'
));

-- Step 3: Update the deduct_storyboard_credits function to handle beta tier.
-- Beta users use credits normally (same as pro), no special exemption needed.
-- The existing function already handles this correctly since beta users
-- are not 'founder' tier and will have their credits deducted normally.
-- No changes needed to the function.

COMMENT ON CONSTRAINT user_profiles_tier_check ON public.user_profiles
  IS 'Allowed subscription tiers: free, founder, lifetime, hobby, pro, producer, beta';
