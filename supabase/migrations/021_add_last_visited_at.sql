-- Migration: 021_add_last_visited_at.sql
-- Purpose: Track when users last visited the app (distinct from last login, which persists via token).
-- Date: 2026-02-10

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.user_profiles.last_visited_at IS 'Timestamp of the user''s most recent app visit, updated via middleware on authenticated requests.';
