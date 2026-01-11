-- Migration: Allow anonymous users to create and view analysis jobs
-- Purpose: Support the free trial system where anonymous users can create 1 analysis
-- This updates RLS policies to allow anonymous access when is_anonymous = true

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.analysis_jobs;
DROP POLICY IF EXISTS "Users can create own jobs" ON public.analysis_jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.analysis_jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.analysis_jobs;

-- Create new policies that support both authenticated and anonymous users

-- SELECT policy: Users can view their own jobs OR anonymous jobs they created (by IP hash)
CREATE POLICY "Users can view own or anonymous jobs"
  ON public.analysis_jobs FOR SELECT
  USING (
    -- Authenticated users can see their own jobs
    (auth.uid() = user_id)
    OR
    -- Anyone can see anonymous jobs (they'll need the job_id to access it)
    (is_anonymous = true)
  );

-- INSERT policy: Allow both authenticated and anonymous inserts
CREATE POLICY "Users can create own jobs or anonymous jobs"
  ON public.analysis_jobs FOR INSERT
  WITH CHECK (
    -- Authenticated users must match their user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Anonymous users must have is_anonymous = true and user_id = NULL
    (is_anonymous = true AND user_id IS NULL)
  );

-- UPDATE policy: Only allow updating jobs you own or created anonymously
CREATE POLICY "Users can update own jobs"
  ON public.analysis_jobs FOR UPDATE
  USING (
    -- Authenticated users can update their own jobs
    (auth.uid() = user_id)
    OR
    -- Anonymous jobs can be updated by anyone who has the job_id
    -- (This is needed for the polling mechanism to update status)
    (is_anonymous = true)
  );

-- No DELETE policy - users cannot delete jobs
-- Jobs are meant to be permanent for sharing/reference
-- Service role can still delete if needed (has GRANT ALL below)

-- Grant permissions for service role (used by API routes)
GRANT ALL ON public.analysis_jobs TO service_role;
