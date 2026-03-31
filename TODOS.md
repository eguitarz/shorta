# TODOS

## Design

### Create DESIGN.md
**Priority:** P3
**What:** Run `/design-consultation` to document the design system: dark theme tokens (#1a1a1a, gray-800 borders), typography scale, spacing, component patterns, Lucide icon usage.
**Why:** Every new component requires reverse-engineering existing patterns from the code. A DESIGN.md makes implementation faster and more consistent.
**Depends on:** Nothing

## Completed

### useAnalysisJob hook extraction
**Completed:** PR #18 (2026-04-01)
**What:** Extracted ~240 lines of state management + 4 useEffects into `hooks/useAnalysisJob.ts`. Analyzer page now focuses on rendering.

### Shareable Fix List card
**Completed:** PR #18 (2026-04-01)
**What:** Client-side canvas rendering of Fix List as downloadable PNG. Dark theme card with video title, score, and top 3 changes. Lazy-loaded.

### Vitest setup + 22 tests
**Completed:** PR #18 (2026-04-01)
**What:** Bootstrapped Vitest with jsdom. 22 tests: FixList weighted fallback (8), storyboard parsing (9), timestamp parsing (5). `npm test` runs them.

### Frame previews in Fix List
**Completed:** PR #17 (2026-04-01)
**What:** YouTube storyboard sprite sheet frame previews in Fix List cards. Zero storage cost — YouTube hosts the images, client-side CSS crops the right tile.
