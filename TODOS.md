# TODOS

## Analyzer

### Extract `useAnalysisJob` hook
**Priority:** P2
**What:** Pull polling + data fetching (~200 lines, 22 useState hooks) from `apps/web/app/(dashboard)/analyzer/[id]/page.tsx` into a reusable custom hook.
**Why:** The page is still ~2800 lines. Extracting state management makes it render-only and the hook reusable if other pages need analysis data.
**Depends on:** Results redesign (shipped in PR #16)

### Frame extraction pipeline
**Priority:** P1
**What:** Extract video frames at beat timestamps, persist to Supabase Storage, serve with signed URLs. Show frames inline in Fix List cards and future VisualInsights component.
**Why:** Visual frame analysis is Shorta's moat over ChatGPT, but users can't see it. Frame images make the Fix List dramatically more compelling ("here's the exact frame where your hook fails").
**Depends on:** Results redesign (shipped in PR #16)

### Shareable Fix List card
**Priority:** P2
**What:** Client-side canvas rendering of the Fix List section as a downloadable/copyable PNG. Video title, 3 fix cards, overall score in a clean dark-theme card format.
**Why:** Creators sharing "here's what Shorta told me to fix" is free marketing. No competitor has this format.
**Depends on:** Results redesign (shipped in PR #16)

## Testing

### Vitest setup + FixList tests
**Priority:** P2
**What:** Set up Vitest (vitest.config.ts, tsconfig), write unit tests for FixList weighted fallback logic and ScoreAccordion rendering.
**Why:** Zero test coverage across the entire codebase. The fallback logic (weighted category selection using NICHE_WEIGHTS) is the riskiest new code path.
**Depends on:** Nothing

## Design

### Create DESIGN.md
**Priority:** P3
**What:** Run `/design-consultation` to document the design system: dark theme tokens (#1a1a1a, gray-800 borders), typography scale, spacing, component patterns, Lucide icon usage.
**Why:** Every new component requires reverse-engineering existing patterns from the code. A DESIGN.md makes implementation faster and more consistent.
**Depends on:** Nothing

## Completed

(none yet)
