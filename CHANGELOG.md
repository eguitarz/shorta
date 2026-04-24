# Changelog

All notable changes to Shorta will be documented in this file.

## [0.2.0.0] - 2026-04-24

### Added
- **Evidence Mode on the analyzer:** every scored category and every beat issue now shows the receipts that produced the claim. Stop asking users to take the AI's word for it.
  - "Why this grade" panel on each score card — shows the concrete signals that pulled the grade up or down (e.g., "time to claim (3.2s) — ≤ 3s would flip this to strong")
  - "Why we flagged this" expander on every beat issue — linter-backed issues show the rule name, rationale, and a good-practice example; AI-discovered issues show a verbatim transcript snippet at its timestamp and one-sentence reasoning grounded in the snippet
  - Falsifiable confidence: every weak or strong signal gets a flip-threshold statement derived directly from the deterministic scoring formulas, so "what would change our mind" is never vague
  - AI-issue falsifier field in the Gemini schema, so the model names one observable condition that would prove its own call wrong
- Feature flag `NEXT_PUBLIC_EVIDENCE_MODE_ENABLED` gates the new UI (client + server safe, live at 100% on flip)
- Full i18n coverage for Evidence Mode across en / es / ko / zh-TW

### Changed
- `ScoreAccordion` accepts `evidenceMode`, `breakdown`, and `videoDuration` props for the new evidence layer
- Gemini beat-analysis prompt now requires every AI-discovered issue to carry a verbatim transcript snippet + timestamp + grounded reasoning, and accepts an optional falsifier line

### Fixed
- Analyzer renders cleanly on pre-migration storyboards (older analysis jobs without the new `evidence` field) — back-compat is locked by regression tests

## [0.1.0.0] - 2026-04-07

### Added
- Blog content engine infrastructure for weekly creator analysis posts
- ShortaReportEmbed component: inline preview cards in blog posts showing analysis scores, thumbnail, and CTA to full report
- HTML comment placeholder syntax (`<!-- shorta-report:JOB_ID -->`) for embedding reports in Markdown blog posts
- OG image generation script (`npm run generate-og`) using Satori with Space Grotesk font
- FAQ schema support via `faqs` frontmatter field, rendered as FAQPage JSON-LD
- PostHog analytics funnel: blog_post_viewed, blog_report_link_clicked, shared_report_viewed with referrer tracking
- AI drafting prompt template for consistent creator analysis blog posts
- Blog post tracker component for page view analytics

### Changed
- Share API now caches responses for 24 hours (Cache-Control headers) since analysis data is immutable after completion
- Share API strips replicationBlueprint from public responses to avoid creator relations issues

### Fixed
- Added @vitejs/plugin-react to vitest config to enable JSX in test files
