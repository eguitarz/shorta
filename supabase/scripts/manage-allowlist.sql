-- ================================================
-- EMAIL ALLOWLIST MANAGEMENT SCRIPTS
-- Run these in Supabase SQL Editor
-- ================================================
--
-- These scripts help you manage the email allowlist for
-- controlling free tier user access to the platform.
--
-- FREE TIER USERS:
--   - Must be on allowlist to access dashboard
--   - Get unlimited analyses if on allowlist
--
-- FOUNDER/LIFETIME TIER USERS:
--   - Always have access (bypass allowlist)
--   - Always have unlimited analyses
--

-- ================================================
-- VIEW: See all allowed emails
-- ================================================

SELECT
  email,
  notes,
  invited_by,
  created_at,
  updated_at
FROM public.email_allowlist
ORDER BY created_at DESC;

-- ================================================
-- ADD: Add new email to allowlist (free tier)
-- ================================================
-- User will have unlimited analyses as free tier user

INSERT INTO public.email_allowlist (email, notes)
VALUES
  ('newuser@example.com', 'Beta tester')
ON CONFLICT (email) DO NOTHING;

-- ================================================
-- ADD: Add multiple emails at once
-- ================================================

INSERT INTO public.email_allowlist (email, notes)
VALUES
  ('user1@example.com', 'Beta tester - invited via newsletter'),
  ('user2@example.com', 'Content creator partner'),
  ('user3@example.com', 'Early adopter from Product Hunt')
ON CONFLICT (email) DO NOTHING;

-- ================================================
-- REMOVE: Remove email from allowlist
-- ================================================
-- User will no longer be able to access dashboard (if free tier)

DELETE FROM public.email_allowlist
WHERE email = 'user@example.com';

-- ================================================
-- UPDATE: Add notes to existing email
-- ================================================

UPDATE public.email_allowlist
SET notes = 'VIP user - content creator with 100k+ followers'
WHERE email = 'user@example.com';

-- ================================================
-- CHECK: See if specific email is allowed
-- ================================================

SELECT is_email_allowed('dalema22@gmail.com');
-- Returns: true or false

-- Alternative: Query the table directly
SELECT * FROM public.email_allowlist
WHERE LOWER(email) = LOWER('dalema22@gmail.com');

-- ================================================
-- AUDIT: Count total allowed emails
-- ================================================

SELECT COUNT(*) as total_allowed_emails
FROM public.email_allowlist;

-- ================================================
-- AUDIT: Recently added emails (last 7 days)
-- ================================================

SELECT
  email,
  notes,
  created_at
FROM public.email_allowlist
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ================================================
-- PROMOTE USER TO FOUNDER TIER
-- ================================================
-- This gives user unlimited analyses and bypasses allowlist check
-- User must have signed up first (auth.users entry exists)

UPDATE public.user_profiles
SET
  tier = 'founder',
  analyses_limit = -1
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- Verify the update
SELECT
  up.tier,
  up.analyses_limit,
  au.email
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email = 'user@example.com';

-- ================================================
-- PROMOTE USER TO LIFETIME TIER
-- ================================================

UPDATE public.user_profiles
SET
  tier = 'lifetime',
  analyses_limit = -1,
  is_lifetime = TRUE,
  lifetime_purchase_date = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- ================================================
-- VIEW USER'S CURRENT STATUS
-- ================================================
-- Shows tier, analyses used/limit, and allowlist status

SELECT
  au.email,
  up.tier,
  up.analyses_used,
  up.analyses_limit,
  CASE
    WHEN up.tier IN ('founder', 'lifetime') THEN 'Bypasses allowlist'
    WHEN ea.email IS NOT NULL THEN 'On allowlist (unlimited)'
    ELSE 'NOT on allowlist (blocked)'
  END as access_status
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.user_id = au.id
LEFT JOIN public.email_allowlist ea ON LOWER(ea.email) = LOWER(au.email)
WHERE au.email = 'user@example.com';

-- ================================================
-- BULK VIEW: All users and their access status
-- ================================================

SELECT
  au.email,
  up.tier,
  up.analyses_used,
  up.analyses_limit,
  CASE
    WHEN up.tier IN ('founder', 'lifetime') THEN 'FOUNDER/LIFETIME (bypass)'
    WHEN ea.email IS NOT NULL THEN 'FREE + ALLOWLIST (unlimited)'
    ELSE 'FREE ONLY (blocked)'
  END as access_status,
  au.created_at as signup_date
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.user_id = au.id
LEFT JOIN public.email_allowlist ea ON LOWER(ea.email) = LOWER(au.email)
ORDER BY au.created_at DESC;

-- ================================================
-- CLEANUP: Remove old/inactive emails from allowlist
-- ================================================
-- Use carefully! This removes emails that haven't signed up

-- See emails on allowlist but no corresponding user account
SELECT ea.email, ea.created_at
FROM public.email_allowlist ea
LEFT JOIN auth.users au ON LOWER(au.email) = LOWER(ea.email)
WHERE au.id IS NULL
ORDER BY ea.created_at DESC;

-- Remove them (uncomment to execute)
-- DELETE FROM public.email_allowlist
-- WHERE email IN (
--   SELECT ea.email
--   FROM public.email_allowlist ea
--   LEFT JOIN auth.users au ON LOWER(au.email) = LOWER(ea.email)
--   WHERE au.id IS NULL
-- );

-- ================================================
-- NOTES
-- ================================================
--
-- To add new users:
-- 1. Free tier (limited access, unlimited analyses):
--    - Add email to allowlist using INSERT statement above
--
-- 2. Founder tier (full access, unlimited analyses):
--    - Either: Add to allowlist first, then promote to founder
--    - Or: User signs up, then promote directly to founder
--
-- 3. Lifetime tier (full access, unlimited analyses):
--    - Same as founder, but use lifetime tier instead
--
-- Remember:
-- - Founder/lifetime users bypass allowlist check
-- - Free tier users MUST be on allowlist to access dashboard
-- - All users on allowlist get unlimited analyses
-- - No redeployment needed to add/remove emails!
--
