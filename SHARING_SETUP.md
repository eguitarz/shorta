# Sharing Feature Setup Guide

## Issues Found

1. **Share URL shows localhost:3000**: Missing `NEXT_PUBLIC_APP_URL` environment variable
2. **"Analysis Not Found" error**: Database migration not applied to production

## Fix Steps

### 1. Apply Database Migration

**CRITICAL**: You must run the migration in your Supabase production database.

Go to your Supabase dashboard → SQL Editor and run this migration:

```sql
-- Migration: Add public sharing for analysis results
-- Purpose: Enable users to share analysis results via permanent public links

-- Add is_public column to analysis_jobs table
ALTER TABLE public.analysis_jobs
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Index for public queries (partial index for better performance)
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_is_public
ON public.analysis_jobs(is_public)
WHERE is_public = TRUE;

-- Comment on column for documentation
COMMENT ON COLUMN public.analysis_jobs.is_public IS 'When true, this analysis can be viewed by anyone with the job_id link, without authentication';
```

**To verify it worked**, run this query:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'analysis_jobs' AND column_name = 'is_public';
```

You should see one row returned with `is_public` and `boolean`.

### 2. Apply File URI Migration (for uploaded videos)

Run this migration for uploaded video support:

```sql
-- Migration: Add file_uri column for uploaded video support
-- Purpose: Store Gemini File API URI for uploaded videos (as alternative to video_url for YouTube)

-- Add file_uri column to analysis_jobs table
ALTER TABLE public.analysis_jobs
ADD COLUMN IF NOT EXISTS file_uri TEXT;

-- Make video_url nullable since we now support either video_url OR file_uri
ALTER TABLE public.analysis_jobs
ALTER COLUMN video_url DROP NOT NULL;

-- Add constraint to ensure at least one video source exists
ALTER TABLE public.analysis_jobs
DROP CONSTRAINT IF EXISTS video_source_required;

ALTER TABLE public.analysis_jobs
ADD CONSTRAINT video_source_required
CHECK (video_url IS NOT NULL OR file_uri IS NOT NULL);

-- Comment on column for documentation
COMMENT ON COLUMN public.analysis_jobs.file_uri IS 'Gemini File API URI for uploaded videos. Either this or video_url must be set.';
COMMENT ON COLUMN public.analysis_jobs.video_url IS 'YouTube video URL. Either this or file_uri must be set.';
```

### 3. Deploy Code Changes

The code has been updated with:
- Production URL configured in `wrangler.toml`
- Support for uploaded video sharing
- Proper error handling

Deploy with:
```bash
npm run cf:build && npx wrangler deploy
```

### 4. Test Sharing

After deploying:

1. **Analyze a video** (YouTube or uploaded)
2. **Click the Share button** - should show a URL starting with `https://shorta.ai`
3. **Copy the share link** and open in incognito window
4. **Verify** the shared page loads with all analysis data

## Troubleshooting

### Still seeing "Analysis Not Found"?

Check these in order:

1. **Migration applied?**
   ```sql
   SELECT id, is_public FROM analysis_jobs LIMIT 5;
   ```
   If this query fails with "column is_public does not exist", the migration wasn't applied.

2. **Job actually shared?**
   ```sql
   SELECT id, is_public, status FROM analysis_jobs WHERE id = 'YOUR_JOB_ID';
   ```
   Should show `is_public = true` and `status = completed`.

3. **Service role key set?**
   The share API uses `SUPABASE_SERVICE_ROLE_KEY` secret. Verify it's set:
   ```bash
   npx wrangler secret list
   ```
   Should show `SUPABASE_SERVICE_ROLE_KEY` in the list.

4. **Check production logs**
   ```bash
   npx wrangler tail
   ```
   Look for errors from the share API endpoint.

### Share URL still shows localhost?

Clear your browser cache and hard refresh:
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + F5

Or test in incognito mode.

## How Sharing Works

1. User clicks "Share" button on completed analysis
2. Frontend calls `POST /api/jobs/{job_id}/share`
3. API verifies:
   - User is authenticated
   - User owns the job
   - Job is completed
4. API sets `is_public = true` on the job
5. Returns share URL: `https://shorta.ai/shared/{job_id}`
6. Anyone with the link can view via `GET /api/share/{job_id}` (no auth required)

## Security Notes

- Only completed jobs can be shared
- Only the job owner can create a share link
- Share links are permanent (no expiration)
- Shared data excludes user PII (only analysis results)
- Uploaded videos show placeholder (no video player for privacy)
