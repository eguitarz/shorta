# Score Columns Migration Guide

## Overview

This migration adds **60+ generated columns** to the `analysis_jobs` table, enabling fast sorting, filtering, and searching on all scoring metrics without needing to query JSONB fields.

### Key Benefits

✅ **Fast Queries**: Direct column access instead of JSONB extraction
✅ **Simple Syntax**: `WHERE hook_strength > 80` instead of `WHERE (storyboard_result->'storyboard'->'performance'->>'hookStrength')::INTEGER > 80`
✅ **Auto-Updated**: Columns auto-populate when JSONB is updated (no application code changes needed)
✅ **Efficient Indexing**: Proper indexes for common query patterns
✅ **Type Safety**: INTEGER/NUMERIC columns instead of text casting

---

## Column Categories

### 1. Overall Scores (0-100 scale)

| Column | Description | JSONB Source |
|--------|-------------|--------------|
| `deterministic_score` | Total weighted score | `storyboard._deterministicScore` |
| `hook_strength` | Hook category score | `performance.hookStrength` |
| `structure_pacing` | Structure category score | `performance.structurePacing` |
| `delivery_performance` | Delivery category score | `performance.deliveryPerformance` |
| `value_clarity` | Clarity category score | `performance.content.valueClarity` |
| `lint_score` | Final lint score with bonuses | `lintSummary.score` |
| `lint_base_score` | Base lint score | `lintSummary.baseScore` |
| `lint_bonus_points` | Bonus points awarded | `lintSummary.bonusPoints` |

### 2. Video Metadata

| Column | Description | JSONB Source |
|--------|-------------|--------------|
| `video_format` | talking_head \| gameplay \| other | `storyboard._format` |
| `hook_category` | Hook type (e.g., premise, visual, conflict) | `overview.hookCategory` |
| `hook_pattern` | Hook pattern description | `overview.hookPattern` |
| `niche_category` | Content niche | `overview.nicheCategory` |
| `content_type` | Type of content | `overview.contentType` |
| `target_audience` | Intended audience | `overview.targetAudience` |

### 3. Hook Submetrics

#### Raw Signals

| Column | Description | Scale/Type | JSONB Source |
|--------|-------------|------------|--------------|
| `hook_tt_claim` | Time to claim (seconds) | NUMERIC | `_signals.hook.TTClaim` |
| `hook_pb` | Pattern break energy | 1-5 | `_signals.hook.PB` |
| `hook_spec` | Specificity count | INTEGER | `_signals.hook.Spec` |
| `hook_qc` | Questions/contradictions | INTEGER | `_signals.hook.QC` |

#### Calculated Scores (0-100)

| Column | Description | JSONB Source |
|--------|-------------|--------------|
| `hook_score_tt_claim` | Time to claim score | `_scoreBreakdown.hook.TTClaim` |
| `hook_score_pb` | Pattern break score | `_scoreBreakdown.hook.PB` |
| `hook_score_spec` | Specificity score | `_scoreBreakdown.hook.Spec` |
| `hook_score_qc` | Questions/contradictions score | `_scoreBreakdown.hook.QC` |

### 4. Structure Submetrics

#### Raw Signals

| Column | Description | Scale/Type | JSONB Source |
|--------|-------------|------------|--------------|
| `structure_bc` | Beat count | INTEGER | `_signals.structure.BC` |
| `structure_pm` | Progress markers | INTEGER | `_signals.structure.PM` |
| `structure_pp` | Payoff present | BOOLEAN | `_signals.structure.PP` |
| `structure_lc` | Loop cue | BOOLEAN | `_signals.structure.LC` |

#### Calculated Scores (0-100)

| Column | Description | JSONB Source |
|--------|-------------|--------------|
| `structure_score_bc` | Beat count score | `_scoreBreakdown.structure.BC` |
| `structure_score_pm` | Progress markers score | `_scoreBreakdown.structure.PM` |
| `structure_score_pp` | Payoff present score | `_scoreBreakdown.structure.PP` |
| `structure_score_lc` | Loop cue score | `_scoreBreakdown.structure.LC` |

### 5. Clarity Submetrics

#### Raw Signals

| Column | Description | Scale/Type | JSONB Source |
|--------|-------------|------------|--------------|
| `clarity_word_count` | Total words | INTEGER | `_signals.clarity.wordCount` |
| `clarity_duration` | Duration (seconds) | NUMERIC | `_signals.clarity.duration` |
| `clarity_sc` | Sentence complexity | 1-5 | `_signals.clarity.SC` |
| `clarity_tj` | Topic jumps | INTEGER | `_signals.clarity.TJ` |
| `clarity_rd` | Redundancy level | 1-5 | `_signals.clarity.RD` |

#### Calculated Scores (0-100)

| Column | Description | JSONB Source |
|--------|-------------|--------------|
| `clarity_score_wps` | Words per second score | `_scoreBreakdown.clarity.WPS` |
| `clarity_score_sc` | Sentence complexity score | `_scoreBreakdown.clarity.SC` |
| `clarity_score_tj` | Topic jumps score | `_scoreBreakdown.clarity.TJ` |
| `clarity_score_rd` | Redundancy score | `_scoreBreakdown.clarity.RD` |

### 6. Delivery Submetrics

#### Raw Signals

| Column | Description | Scale/Type | JSONB Source |
|--------|-------------|------------|--------------|
| `delivery_ls` | Loudness stability | 1-5 | `_signals.delivery.LS` |
| `delivery_ns` | Audio quality | 1-5 | `_signals.delivery.NS` |
| `delivery_pause_count` | Deliberate pauses | INTEGER | `_signals.delivery.pauseCount` |
| `delivery_filler_count` | Filler words (um, uh) | INTEGER | `_signals.delivery.fillerCount` |
| `delivery_ec` | Energy curve present | BOOLEAN | `_signals.delivery.EC` |

#### Calculated Scores (0-100)

| Column | Description | JSONB Source |
|--------|-------------|--------------|
| `delivery_score_ls` | Loudness stability score | `_scoreBreakdown.delivery.LS` |
| `delivery_score_ns` | Audio quality score | `_scoreBreakdown.delivery.NS` |
| `delivery_score_pq` | Pause quality score | `_scoreBreakdown.delivery.PQ` |
| `delivery_score_ec` | Energy curve score | `_scoreBreakdown.delivery.EC` |

---

## Example Queries

### Basic Filtering

```sql
-- Find high-performing videos
SELECT id, video_url, deterministic_score, hook_strength
FROM analysis_jobs
WHERE deterministic_score > 80
ORDER BY deterministic_score DESC;
```

```sql
-- Find videos with specific hook type
SELECT id, video_url, hook_category, hook_strength
FROM analysis_jobs
WHERE hook_category = 'premise'
  AND hook_strength > 70
ORDER BY hook_strength DESC;
```

### Search by Submetrics

```sql
-- Find videos with fast hooks (claim within 3 seconds)
SELECT id, video_url, hook_tt_claim, hook_strength
FROM analysis_jobs
WHERE hook_tt_claim <= 3.0
ORDER BY hook_tt_claim ASC;
```

```sql
-- Find videos with ideal words per second (3-4 WPS)
SELECT
  id,
  video_url,
  clarity_word_count,
  clarity_duration,
  clarity_word_count::NUMERIC / NULLIF(clarity_duration, 0) as actual_wps,
  clarity_score_wps
FROM analysis_jobs
WHERE clarity_score_wps > 80
ORDER BY clarity_score_wps DESC;
```

```sql
-- Find videos with minimal filler words
SELECT id, video_url, delivery_filler_count, delivery_performance
FROM analysis_jobs
WHERE delivery_filler_count < 5
ORDER BY delivery_performance DESC;
```

### Multi-Criteria Searches

```sql
-- Find talking head videos with strong hooks and clear delivery
SELECT
  id,
  video_url,
  video_format,
  hook_strength,
  delivery_performance,
  delivery_filler_count
FROM analysis_jobs
WHERE video_format = 'talking_head'
  AND hook_strength > 75
  AND delivery_performance > 70
  AND delivery_filler_count < 10
ORDER BY deterministic_score DESC;
```

```sql
-- Find videos with good structure (beats, payoff, loop cue)
SELECT
  id,
  video_url,
  structure_bc,
  structure_pp,
  structure_lc,
  structure_pacing
FROM analysis_jobs
WHERE structure_bc BETWEEN 3 AND 6  -- Ideal beat count
  AND structure_pp = true             -- Has payoff
  AND structure_lc = true             -- Has loop cue
ORDER BY structure_pacing DESC;
```

### Advanced Analytics

```sql
-- Calculate average scores by hook category
SELECT
  hook_category,
  COUNT(*) as total_videos,
  ROUND(AVG(deterministic_score), 1) as avg_score,
  ROUND(AVG(hook_strength), 1) as avg_hook,
  ROUND(AVG(delivery_performance), 1) as avg_delivery
FROM analysis_jobs
WHERE hook_category IS NOT NULL
GROUP BY hook_category
ORDER BY avg_score DESC;
```

```sql
-- Find correlation between hook speed and overall performance
SELECT
  CASE
    WHEN hook_tt_claim <= 2 THEN '0-2s (Fast)'
    WHEN hook_tt_claim <= 5 THEN '2-5s (Medium)'
    WHEN hook_tt_claim <= 7 THEN '5-7s (Slow)'
    ELSE '7s+ (Very Slow)'
  END as hook_speed_bucket,
  COUNT(*) as videos,
  ROUND(AVG(deterministic_score), 1) as avg_overall_score,
  ROUND(AVG(hook_strength), 1) as avg_hook_score
FROM analysis_jobs
WHERE hook_tt_claim IS NOT NULL
GROUP BY hook_speed_bucket
ORDER BY avg_overall_score DESC;
```

```sql
-- Top performers with breakdown
SELECT
  id,
  video_url,
  deterministic_score,

  -- Category scores
  hook_strength,
  structure_pacing,
  delivery_performance,
  value_clarity,

  -- Key submetrics
  hook_tt_claim,
  hook_category,
  structure_bc,
  delivery_filler_count,
  clarity_word_count

FROM analysis_jobs
WHERE deterministic_score > 85
ORDER BY deterministic_score DESC
LIMIT 20;
```

### Performance Comparison

```sql
-- Compare gameplay vs talking head videos
SELECT
  video_format,
  COUNT(*) as total,
  ROUND(AVG(deterministic_score), 1) as avg_score,
  ROUND(AVG(hook_strength), 1) as avg_hook,
  ROUND(AVG(structure_pacing), 1) as avg_structure,
  ROUND(AVG(delivery_performance), 1) as avg_delivery,
  ROUND(AVG(value_clarity), 1) as avg_clarity
FROM analysis_jobs
WHERE video_format IN ('talking_head', 'gameplay')
GROUP BY video_format;
```

---

## Applying the Migration

### Option 1: Supabase CLI (Local Development)

```bash
supabase db push
```

### Option 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `014_add_score_columns.sql`
4. Execute the migration

### Option 3: Direct SQL Execution

```bash
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/014_add_score_columns.sql
```

---

## Verifying the Migration

After applying the migration, verify the columns exist:

```sql
-- Check if columns were created
SELECT column_name, data_type, is_generated
FROM information_schema.columns
WHERE table_name = 'analysis_jobs'
  AND column_name LIKE '%score%'
ORDER BY column_name;
```

```sql
-- Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'analysis_jobs'
  AND indexname LIKE 'idx_jobs_%'
ORDER BY indexname;
```

```sql
-- Test with a sample query
SELECT
  id,
  deterministic_score,
  hook_strength,
  video_format,
  hook_category
FROM analysis_jobs
WHERE deterministic_score IS NOT NULL
LIMIT 5;
```

---

## Performance Notes

### Index Usage

The migration creates **20+ indexes** on commonly queried columns:

- Overall scores (deterministic_score, hook_strength, etc.)
- Video metadata (format, hook_category, niche_category)
- Key submetrics (hook_tt_claim, clarity_wps, delivery_filler_count)
- Composite indexes for multi-criteria queries

### Query Optimization

**Before (JSONB):**
```sql
-- Slow: Requires JSONB extraction + casting
WHERE (storyboard_result->'storyboard'->'performance'->>'hookStrength')::INTEGER > 80
```

**After (Generated Columns):**
```sql
-- Fast: Direct column access with index
WHERE hook_strength > 80
```

### Storage Impact

- **Generated columns**: Auto-computed from JSONB (no extra storage for values)
- **Indexes**: ~5-10MB per million rows (actual size varies by data distribution)
- **Total overhead**: Minimal compared to query performance gains

---

## API Usage Examples

### TypeScript/JavaScript (Supabase Client)

```typescript
// Find high-scoring videos
const { data } = await supabase
  .from('analysis_jobs')
  .select('id, video_url, deterministic_score, hook_strength')
  .gt('deterministic_score', 80)
  .order('deterministic_score', { ascending: false });

// Filter by hook category and score
const { data } = await supabase
  .from('analysis_jobs')
  .select('*')
  .eq('hook_category', 'premise')
  .gt('hook_strength', 70)
  .order('hook_strength', { ascending: false });

// Complex multi-criteria search
const { data } = await supabase
  .from('analysis_jobs')
  .select('id, video_url, hook_tt_claim, delivery_filler_count, deterministic_score')
  .lte('hook_tt_claim', 3.0)
  .lt('delivery_filler_count', 10)
  .gt('deterministic_score', 75)
  .order('deterministic_score', { ascending: false });
```

---

## Rollback (If Needed)

If you need to remove the columns and indexes:

```sql
-- Drop all indexes
DROP INDEX IF EXISTS idx_jobs_deterministic_score;
DROP INDEX IF EXISTS idx_jobs_hook_strength;
-- ... (continue for all indexes)

-- Drop all generated columns
ALTER TABLE analysis_jobs DROP COLUMN IF EXISTS deterministic_score;
ALTER TABLE analysis_jobs DROP COLUMN IF EXISTS hook_strength;
-- ... (continue for all columns)
```

---

## Next Steps

1. **Apply the migration** to your database
2. **Update your API endpoints** to use the new columns (optional - existing code keeps working!)
3. **Build search/filter UI** leveraging the new columns
4. **Create analytics dashboards** with aggregation queries
5. **Monitor query performance** and add additional indexes if needed

---

## Questions?

The migration is **backward compatible** - your existing code that reads from JSONB will continue to work. The new columns are generated automatically and provide an additional, faster way to query the data.
