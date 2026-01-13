-- Migration: 010_fix_allowlist_rls.sql
-- Purpose: Fix RLS issue preventing user signup for non-allowlisted users
-- Date: 2026-01-13
--
-- Problem: The trigger create_user_profile_on_signup() calls is_email_allowed()
-- which needs to query email_allowlist, but RLS policy blocks access during signup
-- because auth.jwt() isn't available in the trigger context.
--
-- Solution: Disable RLS on email_allowlist. It's safe because:
-- 1. Only service role can INSERT/UPDATE/DELETE (default behavior)
-- 2. SELECT is harmless (just checks if email is allowed)
-- 3. No sensitive data (just list of allowed emails)
-- 4. Access control is via SECURITY DEFINER functions

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can check own email" ON public.email_allowlist;

-- Disable RLS entirely for email_allowlist
ALTER TABLE public.email_allowlist DISABLE ROW LEVEL SECURITY;

-- Add comment explaining why RLS is disabled
COMMENT ON TABLE public.email_allowlist IS 'Invite-only email allowlist for controlling free tier user access. RLS disabled because: (1) Only service role can modify via SQL, (2) SELECT access is needed by SECURITY DEFINER functions during signup trigger, (3) No sensitive data.';

-- Verify the function still works correctly
-- Test that is_email_allowed can now access the table
DO $$
BEGIN
  -- This should not raise an error
  PERFORM is_email_allowed('test@example.com');
  RAISE NOTICE 'RLS fix successful: is_email_allowed() function can access email_allowlist';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'RLS fix failed: % %', SQLERRM, SQLSTATE;
END;
$$;
