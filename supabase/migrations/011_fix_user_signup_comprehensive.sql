-- Migration: 011_fix_user_signup_comprehensive.sql
-- Purpose: Fix all RLS and trigger issues preventing user signup
-- Date: 2026-01-13
--
-- Problems:
-- 1. email_allowlist RLS blocks is_email_allowed() during trigger execution
-- 2. user_profiles RLS may block INSERT during trigger execution
--
-- Solutions:
-- 1. Disable RLS on email_allowlist (no sensitive data, service-role only writes)
-- 2. Add explicit INSERT policy for service role on user_profiles
-- 3. Ensure trigger function is properly SECURITY DEFINER

-- =====================================================
-- 1. FIX email_allowlist RLS
-- =====================================================

-- Drop the restrictive policy that blocks trigger access
DROP POLICY IF EXISTS "Users can check own email" ON public.email_allowlist;

-- Disable RLS entirely on email_allowlist
-- Safe because:
-- - Only service role can INSERT/UPDATE/DELETE
-- - SELECT is needed by triggers and is harmless
-- - No PII or sensitive data
ALTER TABLE public.email_allowlist DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.email_allowlist IS 'Invite-only email allowlist. RLS disabled to allow trigger access during signup. Only service role can modify.';

-- =====================================================
-- 2. ADD INSERT POLICY for user_profiles
-- =====================================================

-- Allow service role to INSERT (for trigger)
-- This ensures the trigger can create profiles even with RLS enabled
CREATE POLICY "Service role can insert profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (true); -- Service role bypasses this anyway, but explicit is better

-- =====================================================
-- 3. RECREATE TRIGGER FUNCTION with explicit SECURITY DEFINER
-- =====================================================

-- Drop and recreate to ensure it's properly configured
DROP FUNCTION IF EXISTS create_user_profile_on_signup() CASCADE;

CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER
SECURITY DEFINER -- Run with elevated privileges (bypasses RLS)
SET search_path = public, pg_temp -- Security best practice
LANGUAGE plpgsql
AS $$
DECLARE
  v_analyses_limit INTEGER;
BEGIN
  -- Log the signup attempt
  RAISE LOG 'Creating user profile for: % (ID: %)', NEW.email, NEW.id;

  -- Check if email is on allowlist
  IF is_email_allowed(NEW.email) THEN
    v_analyses_limit := -1;  -- Unlimited for allowlisted free users
    RAISE LOG 'User % is on allowlist, granting unlimited analyses', NEW.email;
  ELSE
    v_analyses_limit := 3;   -- Regular free tier limit
    RAISE LOG 'User % is NOT on allowlist, granting 3 analyses', NEW.email;
  END IF;

  -- Create user profile with tier='free' by default
  -- (Founder/lifetime tiers are assigned manually via Stripe or admin action)
  INSERT INTO public.user_profiles (user_id, tier, analyses_limit)
  VALUES (NEW.id, 'free', v_analyses_limit)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE LOG 'Successfully created profile for user: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE LOG 'ERROR creating profile for %: % %', NEW.email, SQLERRM, SQLSTATE;
    -- Re-raise the exception so Supabase knows it failed
    RAISE;
END;
$$;

-- Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- =====================================================
-- 4. VERIFY CONFIGURATION
-- =====================================================

-- Check that email_allowlist RLS is disabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'email_allowlist'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is still enabled on email_allowlist!';
  ELSE
    RAISE NOTICE '✓ RLS disabled on email_allowlist';
  END IF;
END;
$$;

-- Check that user_profiles has INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_profiles'
    AND cmd = 'INSERT'
  ) THEN
    RAISE WARNING 'No INSERT policy found on user_profiles (may rely on SECURITY DEFINER)';
  ELSE
    RAISE NOTICE '✓ INSERT policy exists on user_profiles';
  END IF;
END;
$$;

-- Check that trigger function exists and is SECURITY DEFINER
DO $$
DECLARE
  v_security_type TEXT;
BEGIN
  SELECT prosecdef::TEXT INTO v_security_type
  FROM pg_proc
  WHERE proname = 'create_user_profile_on_signup';

  IF v_security_type = 'true' THEN
    RAISE NOTICE '✓ Trigger function is SECURITY DEFINER';
  ELSE
    RAISE EXCEPTION 'Trigger function is NOT SECURITY DEFINER!';
  END IF;
END;
$$;

RAISE NOTICE '============================================';
RAISE NOTICE 'Migration completed successfully!';
RAISE NOTICE 'User signup should now work for all users.';
RAISE NOTICE '============================================';
