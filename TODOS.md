# TODOS

### Analyzer reverse-engineering for AI animation Shorts
**Added:** 2026-04-18 (from /plan-eng-review — animation storyboard v1, deferred from Layer 3b)
**What:** When `classifyVideo` returns `format === 'ai_animation'`, run a dedicated analyzer prompt that extracts structured `animationMeta` from the uploaded Short (characters, styleAnchor, sceneAnchor, arcTemplate, narrativeRole per beat) — text-only, no image gen. Surface the result on the analyzer page as a new top-level accordion titled "Reverse-engineered animation" with an "AI ANIMATION DETECTED" badge (see plan Design Decisions, Issue 7A).
**Why:** Users who upload AI animation Shorts for analysis get richer insights (style/character/arc extraction) and a bridge to create mode — they can see "here's what your Short looks like in our schema" and then tweak into a new storyboard.
**Pros:** Completes the reverse-direction workflow; richer analyzer value; natural upsell from analyze → create.
**Cons:** Text-only extraction is fragile (character identity from video frames is hard to describe back in words consistently); risk of "uncanny valley" descriptions; adds classifier branch complexity.
**Context:** The foundation is in place — `classifyVideo` now returns `ai_animation` (Layer 3b), and `AnimationMeta` type is canonical. What's missing: (a) `lib/animation/reverse-engineer-prompt.ts` with the analyzer prompt, (b) a branch in `lib/analysis/process-storyboard.ts` that runs this prompt when format is `ai_animation` and writes the result to `storyboard.animationMeta`, (c) UI accordion on `/analyzer/[id]/page.tsx` below ScoreAccordion.
**Depends on:** Layer 3b landed (classifier extended). Should ship AFTER the create flow is validated in beta — reverse-engineering is a secondary value prop.

### Wizard draft persistence for AI Animation wizard
**Added:** 2026-04-18 (from /plan-design-review — animation storyboard v1)
**What:** Auto-save animation wizard draft state to localStorage on field blur. Restore on wizard re-entry. Clear on successful job submit.
**Why:** 3-step wizard with ~6 fields of user input is a lot to lose on accidental tab close or refresh. Rage-quit risk.
**Pros:** Reduces wizard abandonment. No DB writes needed.
**Cons:** Privacy-sensitive — logline could be personal. Needs clear-drafts affordance. Stale drafts accumulate in localStorage.
**Context:** Defer from v1. Add to v1.1 if beta metrics show drop-off at the wizard. ~30 lines with Claude Code.
**Depends on:** Beta usage data on wizard completion rates.

### Polish arc template copy (labels + descriptions)
**Added:** 2026-04-18 (from /plan-design-review — animation storyboard v1)
**What:** Rewrite the 6 arc template labels + 1-line user-facing descriptions to feel punchy and filmmaker-authored, not AI-taxonomy-y. Example target: `Setup → Twist → Payoff: the classic joke shape.` / `Loop: A → B → A but changed.`
**Why:** Label quality determines whether the template picker feels "a tool designed by filmmakers" or "an AI-generated taxonomy." This is the first interactive decision in the arc step, so first-impression weight is high.
**Pros:** Cheap polish that measurably moves quality 10x for copy-sensitive users.
**Cons:** Takes an afternoon with a writer or careful thought.
**Context:** v1 ships with workmanlike labels. Polish copy in v1.1 informed by which templates users actually pick (analytics from /storyboard/create/animation).
**Depends on:** Analytics on arc template pick rates after v1 ship.

### Beat regeneration scope rules for animation mode
**Added:** 2026-04-18 (from /plan-design-review — animation storyboard v1)
**What:** Define explicit beat-regeneration rules: v1 locks payoff + arcTemplate + characters at job submit time. "Regenerate beat" varies only that beat's characterAction/cameraAction/sceneSnippet/dialogue — it does NOT re-draw the arc. Future v2 adds separate "Edit payoff" / "Edit arc" actions that cascade-regenerate downstream beats.
**Why:** Without this rule, the engineer implementing /api/regenerate-beat for animation mode will call Pass 2 in isolation per beat, producing beats that don't fit the locked arc → narrative breaks.
**Pros:** Keeps narrative coherence. Sets clear user expectations. Simpler v1 scope.
**Cons:** Users who want to fundamentally rewrite the payoff have to start a new storyboard (for now).
**Context:** v1 = beat-level variation only. v2 = add edit-payoff + edit-arc affordances with cascade regen.
**Depends on:** v1 ship + user feedback on what post-generation editing they actually want.

### Per-platform export prompts for AI Animation (Veo/Sora/Runway/Kling)
**Added:** 2026-04-18 (from /plan-eng-review — animation storyboard v1)
**What:** Add `lib/animation/render-export.ts` variants for veo/sora/runway/kling beyond the v1 universal template. v1 ships one universal prompt (`[Camera] + [Subject] + [Action] + [Context] + [Style]`) per beat.
**Why:** Each vendor has a distinct prompt dialect that measurably improves output. Veo wants structured/JSON-friendly + ingredients syntax. Sora wants causal chains / world logic. Runway wants motion vectors. Kling wants timeline beat markers.
**Pros:** Users get native-format prompts for their tool of choice; competitive edge.
**Cons:** 4× templates to maintain + track vendor prompt-format drift.
**Context:** Deferred per cross-model tension T4 in the animation storyboard plan. v1 stores structured beat fields (characterRefs, characterAction, cameraAction, sceneSnippet, dialogue) and renders on copy — adding a new platform variant is a pure function, no migration.
**Depends on:** v1 ship + usage telemetry (which tool are copy events targeting).

### Reconcile dual Supabase migration directories
**Added:** 2026-04-18 (from /plan-eng-review — animation storyboard v1)
**What:** Audit `apps/web/supabase/migrations/` (sparse: 001, 014, 030, 031) against root `supabase/migrations/` (dense: 001-033). Pick one source of truth.
**Why:** The two directories have colliding numbering (both have a 030) with different content, targeting the same Supabase DB. Confusing for contributors, risk of future numbering collision, unclear which are applied vs. not.
**Pros:** One source of truth. No silent conflicts on next migration.
**Cons:** Need to verify Supabase DB state to confirm what's actually applied. Possible renumbering required.
**Context:** Animation mode migration 034 lands in root per decision 1A. This TODO cleans up the legacy split before the next migration creates more drift.
**Depends on:** Nothing blocking. Best done before migration 035.

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
