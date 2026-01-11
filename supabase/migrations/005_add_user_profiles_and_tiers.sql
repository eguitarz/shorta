-- Migration: 005_add_user_profiles_and_tiers.sql
-- Purpose: Add user tier tracking, usage limits, and IP-based rate limiting for freemium model
-- Date: 2026-01-09

-- Create user_profiles table for tier and subscription management
CREATE TABLE IF NOT EXISTS public.user_profiles (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to auth.users
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription tier
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN (
    'free',      -- Logged-in user with 3 total analyses
    'founder',   -- $99/year unlimited (price locked forever)
    'lifetime'   -- $199 one-time unlimited
  )),

  -- Usage tracking
  analyses_used INTEGER NOT NULL DEFAULT 0,
  analyses_limit INTEGER NOT NULL DEFAULT 3, -- Free tier gets 3

  -- Subscription metadata
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN (
    'active', 'canceled', 'past_due', 'trialing', null
  )),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,

  -- Lifetime tier tracking
  is_lifetime BOOLEAN DEFAULT FALSE,
  lifetime_purchase_date TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_analyses_usage CHECK (analyses_used >= 0)
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_tier ON public.user_profiles(tier);
CREATE INDEX idx_user_profiles_stripe_customer ON public.user_profiles(stripe_customer_id);

-- Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create anonymous_usage table for IP-based rate limiting (GDPR-compliant)
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hashed IP address (SHA-256 with salt for privacy)
  ip_hash TEXT NOT NULL UNIQUE,

  -- Usage tracking
  analyses_used INTEGER NOT NULL DEFAULT 1,

  -- Migration tracking (if user logs in later)
  migrated_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  migrated_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_anonymous_usage CHECK (analyses_used >= 0)
);

-- Indexes for performance
CREATE INDEX idx_anonymous_usage_ip_hash ON public.anonymous_usage(ip_hash);
CREATE INDEX idx_anonymous_usage_created_at ON public.anonymous_usage(created_at DESC);

-- Row Level Security (restrict to service role only)
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no user access)
CREATE POLICY "Service role only"
  ON public.anonymous_usage
  USING (false); -- Blocks all user access

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_anonymous_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anonymous_usage_updated_at
  BEFORE UPDATE ON public.anonymous_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_anonymous_usage_updated_at();

-- Add is_anonymous column to analysis_jobs
ALTER TABLE public.analysis_jobs
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Update existing constraint to allow nullable user_id for anonymous users
ALTER TABLE public.analysis_jobs
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for anonymous job lookups
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_ip_hash ON public.analysis_jobs(ip_hash)
WHERE is_anonymous = TRUE;

-- Update RLS policies to allow anonymous viewing of their own jobs
CREATE POLICY "Anonymous users can view own jobs by IP"
  ON public.analysis_jobs FOR SELECT
  USING (
    (auth.uid() = user_id) OR  -- Authenticated users
    (is_anonymous = TRUE AND is_public = TRUE) -- Anonymous can view if public
  );

-- Function to auto-create user profile on first login
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, tier, analyses_limit)
  VALUES (NEW.id, 'free', 3)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- Function to check if user has analyses remaining
CREATE OR REPLACE FUNCTION has_analyses_remaining(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_analyses_used INTEGER;
  v_analyses_limit INTEGER;
BEGIN
  SELECT tier, analyses_used, analyses_limit
  INTO v_tier, v_analyses_used, v_analyses_limit
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Paid users have unlimited
  IF v_tier IN ('founder', 'lifetime') THEN
    RETURN TRUE;
  END IF;

  -- Free users have limit
  RETURN v_analyses_used < v_analyses_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Stores user subscription tier and usage limits';
COMMENT ON TABLE public.anonymous_usage IS 'Tracks anonymous user analyses by hashed IP (GDPR-compliant)';
COMMENT ON COLUMN public.anonymous_usage.ip_hash IS 'SHA-256 hash of IP address with salt for privacy - cannot be reversed';
COMMENT ON FUNCTION has_analyses_remaining IS 'Check if user has available analyses (returns true for paid users, checks limit for free users)';
