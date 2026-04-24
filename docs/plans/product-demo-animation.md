# Plan: Product Demo Mode for Animation Creator

**Status:** Eng-reviewed (2026-04-22)
**Owner:** Dale
**Target use case:** Paste `tabnora.com` (or upload screenshots), get a 30s animated product-demo short.

## Review decisions (locked 2026-04-22)

1. **UX:** dedicated Product Demo mode toggle in wizard (as originally proposed). No optional-field shortcut.
2. **Rollout:** ship upload + URL+OG in **one PR**. Paid screenshot API gated on real-world OG quality on 5-10 products post-ship.
3. **SSRF:** URL ingestion MUST enforce https-only, block private/loopback/link-local IPs, 5s fetch timeout, 2MB response cap. No exceptions.
4. **Asset verification:** create endpoint MUST verify uploaded asset paths exist in the bucket before inserting the job. No exceptions.
5. **Upload limits:** reject > 4MB or > 2048px in the upload route. No server-side resize in v1 (WASM image libs add complexity; push work to the user).
6. **Hero selection:** user explicitly picks hero via radio in upload UI. Other uploaded images act as supporting frames on feature_highlight beats.
7. **Multi-reference:** extend `NanaBananaClient.generateImage(prompt, refs: ReferenceImage[])`. Back-compat: existing single-ref callers pass `[ref]`. Unlocks mascot + product in same frame.
8. **Migration:** lands in **`/supabase/migrations/`** (root) as **035**, not `apps/web/supabase/migrations/`. Per TODOS.md item "Reconcile dual Supabase migration directories."
9. **Cloudflare constraint:** self-hosted screenshot rendering not viable on Workers. Paid external API is the only path if Phase 3 ships.

---

## Problem

Animation creator today is narrative-only: text premise → characters → arc → payoff. There's no way to build a product demo. Tabnora (or any product) would need the pipeline to:

1. Ingest product context from a URL or uploaded screenshots.
2. Generate a demo arc (problem → reveal → features → CTA), not a story arc.
3. Keep the product's actual UI visible in the generated frames — not an AI re-imagination of it.

Good news: the heavy lifting already exists. Gemini `gemini-3.1-flash-image-preview` natively accepts reference images via `inlineData`, and the pipeline already uses this for character-sheet pinning ([process-beat-images.ts:119](apps/web/lib/animation/process-beat-images.ts)). We just need a second kind of reference: **product assets**.

---

## Scope (v1)

**In:**
- URL ingestion: paste `tabnora.com`, we fetch OG image + render a hero screenshot + scrape headline/subhead copy.
- Screenshot upload (1–4 images) as an alternative to URL.
- One new arc template: `product_demo` (problem → product_reveal → feature_tour → cta).
- Product assets pinned as reference images on relevant beats (reveal + feature beats).
- Wizard UX: new mode toggle at step 1 ("Story" vs "Product Demo"). Product Demo mode replaces CharactersStep with ProductStep.

**Out (v2+):**
- Multi-page site flows, video capture, interactive demos.
- Logo/brand color extraction into art direction (nice-to-have if cheap).
- Voiceover/dialogue tuned for product marketing.

---

## User flow

1. `/storyboard/create/animation` — user toggles **Product Demo** mode.
2. **Step 1 (Product):** URL field _or_ upload (1–4 images). Headline + one-line value prop (auto-filled from scrape, editable).
3. **Step 2 (Style):** tone, visual style, setting (unchanged from story mode — but `styleAnchor` auto-suggests "clean SaaS marketing" when product mode detected).
4. **Step 3 (Arc + CTA):** arc is locked to `product_demo`; user provides CTA text (replaces `payoff`).
5. Submit → same pipeline as story mode, but product assets flow through as reference images on reveal/feature beats.

---

## Architecture changes

### 1. URL ingestion service

**New file:** `apps/web/lib/product/ingest-url.ts`

- Input: URL string.
- Output: `{ heroImageUrl, screenshotUrl, headline, subhead, productName }`.
- Approach:
  - Fetch HTML, parse `og:image`, `og:title`, `og:description`, `<title>`, first `<h1>`.
  - Render a hero screenshot via a lightweight service. Options:
    - **Preferred:** a public screenshot API (e.g. `urlbox.com`, `screenshotone.com`) — paid, deterministic.
    - **Fallback:** `og:image` only (no live screenshot). Ship with this and add screenshot API if results are weak.
  - Save both images to a new private bucket `product-assets` with path `{user_id}/{storyboard_id}/hero.png` / `screenshot.png`.

**Risk:** OG images are often marketing banners, not product UI. Without a real screenshot API the reveal beat will look generic. Decision needed (see Open Questions).

### 2. Screenshot upload path

**New route:** `POST /api/animation/product-assets/upload`

- Multipart upload, max 4 images, 10MB each, PNG/JPG/WebP.
- Writes to `product-assets` bucket; returns `{ paths: string[] }`.
- Client holds the paths in wizard state; submits them with the create request.

### 3. Data model

**Migration:** `0XX_animation_product_context.sql`

Extend `animation_spec` JSONB (on `analysis_jobs`) and `animation_meta` JSONB (on `generated_storyboards`) with a new optional field:

```ts
productContext?: {
  mode: 'url' | 'upload';
  sourceUrl?: string;
  productName: string;
  headline: string;
  subhead?: string;
  ctaText: string;
  assetPaths: string[];      // private bucket paths
  heroAssetPath?: string;    // the "canonical" product frame
}
```

No new table. No new bucket RLS beyond cloning `character-sheets` policies.

### 4. New arc template

**File:** `apps/web/lib/animation/arc-templates.ts`

Add `product_demo`:

```ts
product_demo: {
  roles: ['hook_problem', 'product_reveal', 'feature_highlight_1', 'feature_highlight_2', 'cta'],
  pacing: [5, 5, 8, 8, 4]  // seconds per beat, sums to 30
}
```

Add it to the whitelist in [api/jobs/animation-storyboard/create/route.ts](apps/web/app/api/jobs/animation-storyboard/create/route.ts).

### 5. Prompt changes

- **[story-prompt.ts](apps/web/lib/animation/story-prompt.ts):** when `productContext` is set, swap the "character" concept for a "product persona" block. Characters array can be 0 or 1 (narrator/mascot optional). Inject headline/subhead/CTA into the spec.
- **[beat-prompt.ts](apps/web/lib/animation/beat-prompt.ts):** product_demo arc gets a different narrative-role map. `product_reveal` and `feature_highlight_*` beats get `productRefs: ['hero']` so the image step pins the screenshot as reference.
- **[process-beat-images.ts](apps/web/lib/animation/process-beat-images.ts):** extend reference-image resolution. Today it reads `beat.characterRefs` → `character-sheets` bucket. Add: if `beat.productRefs` is set → fetch from `product-assets` bucket. Both can stack (character + product in same beat).

### 6. Wizard UI

Full design spec added 2026-04-22 (design review).

**Files:**
- **New:** `apps/web/components/animation/ProductStep.tsx`
- **Modified:** `animation/page.tsx` (mode toggle + per-mode state)
- **i18n:** keys under `animation.product.*` in all 4 locale files

**Information architecture:**
- **Mode toggle:** segmented control at top of wizard, above the step indicator. Persistent across all steps. Two options: `Story` / `Product Demo`. Follows category-pill token vocabulary (see Design System Alignment below).
- **Switching preserves per-mode state:** each mode keeps its own wizard state; user can flip back and forth without data loss.
- **Step count is the same (3) in both modes.** Step 2 content differs:

```
STORY MODE                            PRODUCT DEMO MODE
1. Premise (logline, tone, style,     1. Product  (URL or upload, productName,
   sceneAnchor)                          headline, subhead, CTA text)
2. Characters                         2. Style    (tone, styleAnchor auto-suggests
                                         "Clean SaaS marketing" when empty, sceneAnchor)
3. Arc + Payoff                       3. Arc + CTA (arc locked to `product_demo`,
                                         no dropdown; CTA text field instead of payoff)
```

**Interaction states (full table):**

| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
| Mode toggle | n/a | n/a | n/a | selected state highlighted | n/a |
| URL field | spinner in field + helper "Fetching site..." | placeholder "e.g. tabnora.com" + helper text | red-400 below: "Can't reach that URL" / "Private IP not allowed" / "Site took too long" / "No product info found" | value + "✓ from website" label in text-[10px] uppercase tracking-wider text-gray-500 | "Some fields couldn't be auto-filled" note below URL field |
| Upload dropzone | per-file progress bar | dashed-border card + "Drop screenshots or click to upload" | inline red-400: "Image too large (>4MB)" / "Not an image" / "Over 2048px" / "Max 4 files" | thumbnail grid with hero radio on each | per-file status; failed items retry-able |
| Product fields (headline/subhead/productName/CTA) | skeleton rows while scraping | empty fields; post-submit validation shows red-400 required-field message | inline field error (max length, empty required) | user-edited state retained | mix of scraped + user-edited |
| Submit button | disabled + spinner "Creating..." | disabled when required fields missing | toast on server error + inline explanation | wizard transitions to polling phase | n/a |

**Auto-fill behavior:**
- Partial scrape: auto-fill what we found, leave rest empty. Subtle note under URL field: "Some fields couldn't be auto-filled" in text-[10px] text-gray-500.
- Re-scrape (user pastes a new URL): **overwrites all fields**, including user-edited ones. Simpler mental model — the URL is the canonical input. Show brief toast confirming the refresh.

**User journey:**

| Step | User does | User feels | Spec |
|------|-----------|-----------|------|
| 1 | Lands on wizard | "What are my options?" | Segmented mode toggle above step indicator; plain copy "Story" / "Product Demo" |
| 2 | Picks Product Demo | "OK, prove it" | Step 1 shows URL field + OR divider + upload dropzone, no hero decoration |
| 3 | Pastes URL | "Will this find anything?" | 5s loading with in-field spinner + helper text |
| 4 | Sees auto-filled fields | "Oh, it worked" | "✓ from website" micro label on each auto-filled field |
| 5 | Uploads screenshot | "Belt and suspenders" | Dropzone accepts drag-drop + click-to-upload (keyboard accessible). 1-4 files |
| 6 | Picks hero | "I'm in control" | First upload pre-selected as hero; user can reassign via radiogroup |
| 7 | Advances to Style | "Same flow I know" | Same step indicator layout; styleAnchor auto-suggests "Clean SaaS marketing" if empty |
| 8 | Advances to Arc + CTA | "Almost done" | Arc locked to `product_demo` (no dropdown). CTA text field with placeholder "Try Tabnora free" |
| 9 | Submits | "Please don't fail" | Disabled-while-submitting + existing ProgressPolling component |
| 10 | Downloads / shares | "I have to show this" | Reuses existing export-pack download flow |

**Design system alignment (ProductStep must match existing wizard steps exactly):**

| Element | DESIGN.md tokens | Reference |
|---------|------------------|-----------|
| Step title | `font-[var(--font-space-grotesk)] text-lg text-white` | [CharactersStep.tsx:66](apps/web/components/animation/CharactersStep.tsx:66) |
| Step subtitle | `text-xs text-gray-400 mt-1` | [CharactersStep.tsx:69](apps/web/components/animation/CharactersStep.tsx:69) |
| URL input | existing PremiseStep input styling (`bg-inset border-gray-800 rounded-md text-xs px-3 py-2`) | PremiseStep logline field |
| Dropzone (empty) | `border border-dashed border-gray-700 rounded-xl p-4 text-xs text-gray-500` | [CharactersStep.tsx:87](apps/web/components/animation/CharactersStep.tsx:87) |
| Upload thumbnail | `bg-[#1a1a1a] border border-gray-800 rounded-lg` | DESIGN.md Card pattern |
| Hero radio | `w-4 h-4 border-gray-600 checked:bg-blue-500` | Tailwind form default |
| Auto-fill micro label | `text-[10px] uppercase tracking-wider text-gray-500` | DESIGN.md micro labels |
| Error text | `text-xs text-red-400` | DESIGN.md status colors |
| Loading spinner | `Loader2 w-4 h-4 animate-spin text-gray-400` (Lucide) | DESIGN.md icons |
| Mode toggle (off) | `text-gray-400 hover:text-gray-300 px-3 py-1.5 text-xs uppercase tracking-wide` | — |
| Mode toggle (on) | `text-white bg-[#252525] px-3 py-1.5 text-xs uppercase tracking-wide` | bg-surface-hover |

**Anti-slop constraints (APP UI classifier):**
- ❌ No icon-in-colored-circle next to URL/Upload options
- ❌ No centered hero decoration on mode toggle
- ❌ No purple/indigo gradient on the Product Demo state
- ❌ No emoji in copy
- ❌ No cloud-upload icon + "Drag and drop or click" centered cookie-cutter
- ❌ No big circle "OR" divider between URL and upload
- ✅ Utility copy only: "Drop screenshots or click" (not "Drag your beautiful images!")
- ✅ Reuse the dashed-border empty-slot pattern from CharactersStep
- ✅ Plain "Story" / "Product Demo" toggle labels — no icons

**Responsive:**
- `<768px` (mobile): mode toggle full-width, URL field full-width, dropzone full-width, uploaded thumbnails 2-col grid
- `≥768px`: URL field above dropzone, thin divider (not big circle) with "or", thumbnails 4-col

**A11y:**
- Mode toggle: `role="tablist"` + `role="tab"` + `aria-selected`
- URL field: visible `<label for="...">`, not placeholder-as-label
- Dropzone: `<input type="file" multiple accept="image/png,image/jpeg,image/webp">` behind the dashed card; keyboard Enter triggers picker
- Hero radio: `<fieldset>` + `<legend>`, `role="radiogroup"`, visible radio labels
- Loading: `aria-busy="true"` on URL field container during scrape
- Errors: inline `role="alert"` + `aria-live="polite"` region per field
- Touch targets: 44px min on mode toggle buttons and hero radios (use `p-3` wrap)
- Focus order: toggle → URL → upload → first hero radio → next-step button

### 7. Credits

Product demo consumes the same budget as story mode (5 beats × image cost). No pricing change in v1.

---

## Rollout

1. **Phase 1 (URL-less MVP):** ship upload-only path. Lets us prove the reference-image pinning works on real product UI before wiring scraping.
2. **Phase 2:** add URL ingest with OG-image fallback.
3. **Phase 3:** add screenshot API if OG-image quality is too low.

Feature-flagged behind `isAnimationProductModeEnabled()` (mirrors existing `isAnimationModeEnabled()`). Premium-only, same gate as story mode.

---

## Open questions

1. **Screenshot API vs OG-image only?** OG images are often marketing banners. Do we pay for `urlbox`/`screenshotone` ($20–50/mo) to get real product screenshots at reveal time, or ship Phase 2 with OG-only and see?
2. **How strict is "on-model"?** Gemini with a reference image will preserve layout/color/type roughly, but it _will_ reinterpret details. Is that acceptable for a demo, or do we need to composite the actual screenshot into the frame (harder — requires overlay/mask logic)?
3. **Dialogue voice:** product marketing voice is different from narrative voice. Do we need a separate prompt or can one prompt handle both with a tone hint?
4. **Characters in product mode:** allow an optional mascot/narrator character? (Clippy-style.) Simple to support — just keep the existing character pipeline alive, 0–1 character.

---

## Test plan

Full coverage diagram + per-path list: `~/.gstack/projects/eguitarz-shorta/eguitarz-main-eng-review-test-plan-20260422-174833.md`. Summary:

**Unit (20 paths):**
- `ingest-url.ts`: valid URL, private-IP reject (SSRF), non-https reject, timeout, oversize reject, 404/500, missing OG (fallback to `<title>`/`<h1>`), malformed HTML.
- `upload/route.ts`: auth/CSRF/size/dim/MIME/count rejections; happy path.
- `create/route.ts`: productContext paths don't exist → reject; product_demo whitelist; spec persistence.
- `arc-templates.ts`: `getArcTemplate('product_demo')`.
- `story-prompt.ts`: productContext present injects headline/subhead/CTA; 0-char product demo valid.
- `beat-prompt.ts`: product_demo arc emits `productRefs: ['hero']` on reveal/feature beats.
- `process-beat-images.ts`: productRefs resolution, multi-ref stacking, graceful fallback on download failure.
- `nana-banana-client.ts`: single ref (back-compat), array of 2 refs, empty array.

**Regressions (5, mandatory per iron rule):**
1. Story-mode job (no productContext) — status transitions unchanged.
2. `story-prompt.ts` without productContext — snapshot identical to pre-change.
3. `beat-prompt.ts` non-product arcs — snapshot identical.
4. `process-beat-images.ts` character-only beats — behavior identical.
5. `nana-banana-client.ts` single-ref call site — request body byte-identical.

**E2E (3 paths):**
1. URL path: paste `tabnora.com` → submit → poll → reveal beat shows product UI.
2. Upload path: 3 screenshots → pick hero → submit → hero pinned on reveal + feature beats.
3. Story-mode full flow regression.

**Eval (deferred v1.1):**
Product_demo prompt-quality eval suite against 5+ reference products. Not blocking v1 — ship without, add eval once we have real outputs to benchmark against.

**Visual QA:** `/design-review` on 3 products after ship: Tabnora (SaaS), a Shopify product page, an App Store page.

---

## Files touched (estimate)

- New: `lib/product/ingest-url.ts`, `components/animation/ProductStep.tsx`, `api/animation/product-assets/upload/route.ts`, migration.
- Modified: `animation/page.tsx`, `api/jobs/animation-storyboard/create/route.ts`, `lib/animation/arc-templates.ts`, `lib/animation/story-prompt.ts`, `lib/animation/beat-prompt.ts`, `lib/animation/process-beat-images.ts`, 4 locale JSON files.

~11 new/modified files (added `nana-banana-client.ts` for multi-ref support). Phase 1 + Phase 2 in one PR: ~1-1.5 days with CC+gstack.

---

## NOT in scope

- **Paid screenshot API integration.** Gated on quality check after ship. Tracked as TODO.
- **LLM eval suite for product_demo prompt.** Add in v1.1 once we have 5+ real outputs to benchmark against.
- **Server-side image resize.** Upload route rejects oversize; user must resize. WASM image libs on Workers add complexity not justified for v1.
- **Multi-page product flows.** One hero + supporting frames only. No "walk through these 5 screens" pacing.
- **Logo/brand color extraction into art direction.** Nice-to-have; defer until we know it matters.
- **Voiceover/dialogue tuned for marketing voice.** Current story/beat prompts handle both with tone hints. Revisit if outputs sound narrative instead of promotional.
- **Beat regeneration in product_demo mode.** Reuses the same v1 rules established for story mode (beat-level variation only; arc/payoff locked).

## What already exists (reuse, don't rebuild)

| Need | Existing mechanism | Location |
|------|--------------------|----------|
| Reference-image pinning (native Gemini) | `resolveReferenceImage` + `inlineData` | `lib/animation/process-beat-images.ts:216` |
| Private bucket + per-user RLS | `character-sheets` bucket + policies | Migration `034` |
| Credit charging per image | `chargeUserForImageGeneration` | `lib/storyboard-usage.ts` |
| Credit cap enforcement | `MAX_CREDITS_PER_ANIMATION_JOB` | `lib/storyboard-usage.ts` |
| Feature flag pattern | `isAnimationModeEnabled()` | infra |
| 3-step wizard state + job polling | `animation/page.tsx` + `ProgressPolling` | `apps/web/app/(dashboard)/storyboard/create/animation/` |
| Auth + CSRF helpers | `requireAuthWithCsrf` | `lib/auth-helpers.ts` |
| Animation spec → meta flow | `processStory` copies spec into meta | `lib/animation/process-story.ts` |

## Failure modes

For each new codepath, one realistic production failure and coverage:

| Codepath | Failure mode | Test? | Error handling? | User visibility? |
|----------|--------------|-------|----------------|------------------|
| `ingestUrl` | User pastes URL behind auth wall → returns login page HTML → bogus OG | NO (add) | Partial (OG missing → fallback) | ✅ User can edit auto-filled fields |
| `ingestUrl` | SSRF to private IP | **CRITICAL** YES | YES (reject) | ✅ Error message |
| `upload/route` | User PUTs directly to bucket bypassing route | N/A | RLS prevents cross-user; create route verifies paths exist | ✅ Create rejects with clear error |
| `create/route` | Client sends `productContext` pointing to non-existent paths | YES (mandatory) | YES (reject before job insert) | ✅ Error message |
| `process-beat-images` | Product asset deleted mid-job | NO (add) | YES (falls back to character sheet or legacy) | ⚠️ Silent degrade — beat generates without product ref. Flag in logs. |
| `nana-banana-client` multi-ref | Gemini rejects 2-image input | NO (add) | Retry once (existing) | ⚠️ Beat fails after retry, marked with error in UI |

**No critical gaps** (all failure modes have at least test + handling + user visibility planned). One near-gap: product asset deleted mid-job is a silent degrade. Acceptable — log it, monitor if it becomes common.

## Worktree parallelization

Three lanes independent enough to parallelize:

| Lane | Work | Modules touched | Depends on |
|------|------|-----------------|------------|
| A (backend core) | Migration 035, create route validation, `nana-banana-client` multi-ref | `supabase/migrations/`, `api/jobs/`, `lib/image-generation/` | — |
| B (ingestion) | `ingestUrl` + SSRF guards, upload route | `lib/product/`, `api/animation/product-assets/` | — |
| C (pipeline + prompts) | arc template, story-prompt, beat-prompt, process-beat-images product-ref branch | `lib/animation/` | A (multi-ref signature) |
| D (UI) | ProductStep, mode toggle, i18n | `components/animation/`, `app/(dashboard)/storyboard/`, `messages/` | B (upload route shape), C (arc id) |

**Execution:** Launch A + B in parallel worktrees. Merge both. Then C + D in parallel. Merge.

**Conflict flags:** C and D both touch wizard page state — coordinate state-shape changes or do D after C merges.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 5 issues resolved, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score: 3/10 → 9/10, 8 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** ENG + DESIGN CLEARED — ready to implement.
