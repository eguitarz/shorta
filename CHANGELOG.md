# Changelog

All notable changes to Shorta will be documented in this file.

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
