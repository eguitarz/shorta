-- Migration: 022_add_canceling_status.sql
-- Purpose: Add 'canceling' as a valid subscription_status for users who canceled but still have access until period end.
-- Date: 2026-02-10

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_subscription_status_check;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_subscription_status_check
CHECK (subscription_status IN (
  'active', 'canceled', 'canceling', 'past_due', 'trialing', null
));
