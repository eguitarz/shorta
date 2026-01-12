-- Migration: 009_add_email_allowlist.sql
-- Purpose: Add invite-only email allowlist for free tier users
-- Date: 2026-01-13
--
-- Description:
-- This migration creates an email allowlist system that:
-- - Controls dashboard access for free tier users only
-- - Founder/lifetime tier users always have access (bypass allowlist)
-- - Free tier users on allowlist get unlimited analyses
-- - Allows manual addition/removal of emails without redeployment

-- =====================================================
-- 1. CREATE EMAIL ALLOWLIST TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.email_allowlist (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email address (case-insensitive, unique)
  email TEXT NOT NULL UNIQUE,

  -- Optional metadata
  notes TEXT, -- Context about the invite (e.g., "Beta tester", "Content partner")
  invited_by TEXT, -- Who invited them (optional tracking)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Validation constraint
  CONSTRAINT valid_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_email_allowlist_email ON public.email_allowlist(LOWER(email));
CREATE INDEX idx_email_allowlist_created_at ON public.email_allowlist(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.email_allowlist IS 'Invite-only email allowlist for controlling free tier user access to the platform';
COMMENT ON COLUMN public.email_allowlist.email IS 'Email address allowed to access dashboard (case-insensitive)';
COMMENT ON COLUMN public.email_allowlist.notes IS 'Optional context about the invite';

-- =====================================================
-- 2. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.email_allowlist ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check if their own email is on the list
-- (They cannot see the full list, only query their own email)
CREATE POLICY "Users can check own email"
  ON public.email_allowlist FOR SELECT
  USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- Only service role can add/remove emails (via SQL or future admin UI)
-- No policy needed - defaults to service role only

-- =====================================================
-- 3. HELPER FUNCTION: CHECK IF EMAIL IS ALLOWED
-- =====================================================

CREATE OR REPLACE FUNCTION is_email_allowed(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.email_allowlist
    WHERE LOWER(email) = LOWER(p_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_email_allowed IS 'Check if an email address is on the allowlist (case-insensitive)';

-- =====================================================
-- 4. AUTO-UPDATE TIMESTAMP TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_email_allowlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_allowlist_updated_at
  BEFORE UPDATE ON public.email_allowlist
  FOR EACH ROW
  EXECUTE FUNCTION update_email_allowlist_updated_at();

-- =====================================================
-- 5. UPDATE USER PROFILE CREATION TRIGGER
-- =====================================================

-- This replaces the existing trigger from migration 005
-- New logic: Give unlimited analyses to allowlisted free tier users

CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_analyses_limit INTEGER;
BEGIN
  -- Check if email is on allowlist
  IF is_email_allowed(NEW.email) THEN
    v_analyses_limit := -1;  -- Unlimited for allowlisted free users
  ELSE
    v_analyses_limit := 3;   -- Regular free tier limit (will be blocked by dashboard anyway)
  END IF;

  -- Create user profile with tier='free' by default
  -- (Founder/lifetime tiers are assigned manually via Stripe or admin action)
  INSERT INTO public.user_profiles (user_id, tier, analyses_limit)
  VALUES (NEW.id, 'free', v_analyses_limit)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger already exists from migration 005, no need to recreate it
-- The function update above will be used by the existing trigger

-- =====================================================
-- 6. SEED INITIAL DATA
-- =====================================================

-- Add the original hardcoded email to allowlist
INSERT INTO public.email_allowlist (email, notes)
VALUES
  ('dalema22@gmail.com', 'Original founder - migrated from hardcoded whitelist')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 7. UPDATE EXISTING USER TO FOUNDER TIER (if needed)
-- =====================================================

-- This ensures dalema22@gmail.com has founder tier and unlimited analyses
-- Safe to run multiple times (idempotent)
UPDATE public.user_profiles
SET
  tier = 'founder',
  analyses_limit = -1
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dalema22@gmail.com'
)
AND tier != 'founder'; -- Only update if not already founder

-- =====================================================
-- END OF MIGRATION
-- =====================================================
