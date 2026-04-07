# TODOS

### Pin analysis data for blog-referenced analyses
**Added:** 2026-04-07 (from /plan-eng-review)
**What:** Add a `pinned` boolean to `analysis_jobs` table. Jobs referenced in blog posts (via `<!-- shorta-report:JOB_ID -->` placeholders) should be marked pinned and excluded from any future data cleanup or deletion automation.
**Why:** Blog posts are permanent content. If analysis data is ever cleaned up automatically, embedded report cards will break silently. Currently mitigated by not having cleanup automation, but this should be addressed before adding any data lifecycle management.
**Depends on:** Only needed before implementing data cleanup/retention policies.

## Completed

### Create DESIGN.md
**Completed:** 2026-04-01
**What:** Documented the full design system: dark theme tokens, typography scale, color system (surfaces, text, borders, semantic, grades), spacing, layout, border radius, motion, icon patterns, component patterns, anti-patterns.

### useAnalysisJob hook extraction
**Completed:** PR #18 (2026-04-01)
**What:** Extracted ~240 lines of state management + 4 useEffects into `hooks/useAnalysisJob.ts`.

### Shareable Fix List card
**Completed:** PR #18 (2026-04-01)
**What:** Client-side canvas rendering of Fix List as downloadable PNG.

### Vitest setup + 22 tests
**Completed:** PR #18 (2026-04-01)
**What:** Bootstrapped Vitest with jsdom. 22 tests covering fallback logic and storyboard parsing.

### Frame previews in Fix List
**Completed:** PR #17 (2026-04-01)
**What:** YouTube thumbnail frame previews in Fix List cards with timestamp badges.
