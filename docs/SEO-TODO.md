# SEO Improvement Plan

Based on Google Search Console analysis (Jan 2026)

## Current Performance

| Query | Impressions | Clicks | CTR | Avg Position |
|-------|-------------|--------|-----|--------------|
| shorta ai | 33 | 2 | 6% | 2.4 |
| shorta | 139 | 1 | 0.7% | 10.7 |
| shorta.ai youtube shorts analyzer | 63 | 0 | 0% | ? |
| shorta.ai pricing | 30 | 0 | 0% | ? |

## Root Causes

1. **Position 10.7 for "shorta"** — below fold, users don't see it
2. **No non-branded keywords** — not ranking for "youtube shorts storyboard" etc.
3. **Low CTR** — meta titles were feature-focused, not benefit-focused

---

## Completed ✅

- [x] Update root meta title/description for better CTR
- [x] Add pricing page metadata (was missing)
- [x] Improve analyzer tool pages meta descriptions
- [x] Add Google Search Console verification instructions

## This Session - TODO

- [ ] Update homepage meta to storyboard-first positioning (analyzer is free entry point)
- [ ] Update OG siteName to reflect storyboard focus
- [ ] Commit and push changes

## Post-Deploy Actions

- [ ] Request re-indexing in Google Search Console
- [ ] Monitor CTR changes over 2-4 weeks
- [ ] Add Google verification code to `apps/web/app/layout.tsx:79`

---

## Backlink Building (Priority Order)

### Quick Wins (1-2 weeks)
- [ ] Submit to Product Hunt
- [ ] Submit to tool directories: AlternativeTo, G2, Capterra, SaaSHub, BetaList

### Medium-term (1-2 months)
- [ ] Guest post outreach to creator blogs (TubeBuddy, Vidooly, etc.)
- [ ] Sign up for HARO / Connectively for journalist mentions
- [ ] Post helpful content in r/NewTubers, r/youtubers (no spam)

### High-impact (Ongoing)
- [ ] Create linkable research: "We analyzed 1000 viral Shorts — hook patterns that work"
- [ ] Build relationships with YouTube creator influencers

---

## Content Strategy

### Current Positioning
- **Primary:** Storyboard generator (paid)
- **Secondary:** Analyzer (free entry point)

### Keyword Targets

**Storyboard (primary):**
- youtube shorts storyboard generator
- short form video storyboard
- plan youtube shorts before filming

**Analyzer (free funnel):**
- youtube shorts analyzer free
- analyze youtube shorts
- why my youtube shorts get low views

---

## Technical SEO Checklist

- [x] Sitemap configured (`/sitemap.xml`)
- [x] Robots.txt configured
- [x] Structured data (JSON-LD) on homepage
- [x] Canonical URLs set
- [x] OG/Twitter cards configured
- [ ] Google Search Console verification code (user to add)
- [ ] Hreflang tags for i18n (optional, if targeting non-English)

---

## Notes

- Meta changes improve CTR but won't fix position
- Position 10.7 needs backlinks to improve
- Monitor GSC weekly after deploying changes
