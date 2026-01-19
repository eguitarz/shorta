-- Migration: Update generated_storyboards to support both analyzed and created storyboards
--
-- The table currently stores storyboards generated from video analysis (with fixes applied).
-- We need to also support storyboards created from scratch via the "Build" feature.

-- 1. Add source column to distinguish between 'analyzed' and 'created' storyboards
ALTER TABLE generated_storyboards
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'analyzed';

-- 2. Add hook_variants column for created storyboards (they have multiple hook options)
ALTER TABLE generated_storyboards
ADD COLUMN IF NOT EXISTS hook_variants JSONB;

-- 3. Make analysis_job_id nullable (it will be null for created storyboards)
-- First drop the foreign key constraint if it exists
ALTER TABLE generated_storyboards
DROP CONSTRAINT IF EXISTS generated_storyboards_analysis_job_id_fkey;

-- Make the column nullable
ALTER TABLE generated_storyboards
ALTER COLUMN analysis_job_id DROP NOT NULL;

-- Re-add foreign key as nullable (ON DELETE SET NULL)
ALTER TABLE generated_storyboards
ADD CONSTRAINT generated_storyboards_analysis_job_id_fkey
FOREIGN KEY (analysis_job_id) REFERENCES analysis_jobs(id) ON DELETE SET NULL;

-- 4. Update existing records to have source = 'analyzed'
UPDATE generated_storyboards
SET source = 'analyzed'
WHERE source IS NULL AND analysis_job_id IS NOT NULL;

-- 5. Add index for source column for filtering
CREATE INDEX IF NOT EXISTS idx_generated_storyboards_source
ON generated_storyboards(source);

-- 6. Add comment to document the table's dual purpose
COMMENT ON TABLE generated_storyboards IS 'Stores storyboards from two sources: 1) analyzed (from video analysis with applied fixes), 2) created (built from scratch via Build feature)';
COMMENT ON COLUMN generated_storyboards.source IS 'Source of storyboard: analyzed (from video analysis) or created (from scratch)';
COMMENT ON COLUMN generated_storyboards.hook_variants IS 'Hook variants array for created storyboards (4 different hook options)';
