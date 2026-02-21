# Shorta Pricing Research & Analysis
## Research Date: January 19, 2026

---

## Executive Summary

This document analyzes:
1. **Cost per storyboard generation** (Google Gemini API costs)
2. **Creator usage patterns** (how many storyboards needed per month)
3. **Pricing benchmarks** (competitor pricing and willingness to pay)
4. **Recommendations** (optimal pricing strategy)

---

## 1. Cost Per Storyboard Generation

### API Usage Breakdown

Shorta uses Google Gemini API for storyboard generation. The typical workflow involves:

#### **Workflow A: Analyze Existing Video → Generate Storyboard**

**Step 1: Video Analysis** (`/api/analyze-video`)
- **API Call 1**: `classifyVideo()` - Gemini 2.5 Flash
  - Processes: First 15 seconds of video
  - Estimated tokens: ~800-1,500 input + ~200 output

- **API Call 2**: `analyzeVideo()` - Gemini 2.5 Flash
  - Processes: Full video with variable FPS (0.25-1 fps based on duration)
  - For 30-60 second Short: ~2,000-4,000 input + ~2,500-4,000 output
  - For longer videos (60-180s): Uses 0.5 fps to optimize costs

**Step 2: Storyboard Generation** (`/api/generate-storyboard`)
- **API Call 3**: `chat()` - Gemini 2.5 Flash
  - Input: Detailed prompt + beat descriptions + fixes (est. 3,000-5,000 tokens)
  - Output: Complete JSON storyboard (est. 3,000-6,000 tokens)
  - Config: maxTokens=16,384, temperature=0.7

**Total Estimated Token Usage (Workflow A):**
- **Input tokens**: 5,800-10,500 tokens
- **Output tokens**: 5,700-10,200 tokens
- **Total**: ~11,500-20,700 tokens per complete analysis + generation

---

#### **Workflow B: Create Storyboard from Scratch**

**Single API Call** (`/api/create-storyboard`)
- **API Call**: `chat()` - Gemini 3 Flash Preview (or 2.5 Flash)
  - Input: Topic + format + key points (est. 1,000-2,000 tokens)
  - Output: Complete storyboard with 4 hook variants (est. 4,000-7,000 tokens)

**Total Estimated Token Usage (Workflow B):**
- **Input tokens**: 1,000-2,000 tokens
- **Output tokens**: 4,000-7,000 tokens
- **Total**: ~5,000-9,000 tokens per creation

---

### Google Gemini API Pricing (2026)

According to official Google AI documentation:

| Model | Input Cost | Output Cost |
|-------|-----------|------------|
| Gemini 2.5 Flash | $0.10 / 1M tokens | $0.40 / 1M tokens |
| Gemini 2.5 Flash-Lite | $0.10 / 1M tokens | $0.40 / 1M tokens |
| Gemini 2.0 Flash | $0.10 / 1M tokens | $0.40 / 1M tokens |

**Note**: Context caching can reduce costs by up to 75% for repeated video analysis.

---

### Cost Calculation Per Storyboard

#### **Scenario 1: Analyze Video + Generate (Workflow A)**

**Conservative Estimate:**
- Input tokens: 5,800 × $0.10 / 1M = $0.00058
- Output tokens: 5,700 × $0.40 / 1M = $0.00228
- **Total: ~$0.00286 per storyboard** (~0.3 cents)

**High-End Estimate (longer videos):**
- Input tokens: 10,500 × $0.10 / 1M = $0.00105
- Output tokens: 10,200 × $0.40 / 1M = $0.00408
- **Total: ~$0.00513 per storyboard** (~0.5 cents)

**Average Cost: $0.004 per storyboard (0.4 cents)**

---

#### **Scenario 2: Create from Scratch (Workflow B)**

**Conservative Estimate:**
- Input tokens: 1,000 × $0.10 / 1M = $0.0001
- Output tokens: 4,000 × $0.40 / 1M = $0.0016
- **Total: ~$0.0017 per storyboard** (~0.17 cents)

**High-End Estimate:**
- Input tokens: 2,000 × $0.10 / 1M = $0.0002
- Output tokens: 7,000 × $0.40 / 1M = $0.0028
- **Total: ~$0.003 per storyboard** (~0.3 cents)

**Average Cost: $0.0024 per storyboard (0.24 cents)**

---

### With Context Caching Optimization

Shorta already implements context caching for video analysis:

```typescript
if (isYouTube && client.createVideoCache) {
  cachedContent = await client.createVideoCache(url);
}
```

**Cost Reduction**: Up to 75% for repeated video analysis
- **Cached video analysis cost**: ~$0.001 per storyboard (0.1 cents)

---

### **FINAL COST PER STORYBOARD**

| Workflow | Without Caching | With Caching |
|----------|----------------|--------------|
| **Analyze + Generate** | $0.004 (0.4¢) | $0.001-$0.002 (0.1-0.2¢) |
| **Create from Scratch** | $0.0024 (0.24¢) | N/A |

**Blended Average: $0.003 per storyboard (~0.3 cents)**

---

## 2. Creator Usage Patterns

### How Many Storyboards Do Creators Need Per Month?

Based on YouTube Shorts creator statistics for 2026:

#### **Creator Segments**

| Creator Type | Shorts Posted/Month | Storyboards Needed* | Monthly API Cost |
|--------------|---------------------|---------------------|------------------|
| **Casual Creator** | 4-7 | 4-7 | $0.012 - $0.028 |
| **Active Creator** | 12-16 | 12-16 | $0.036 - $0.064 |
| **Professional Creator** | 18-22 | 18-22 | $0.054 - $0.088 |
| **Power User** | 30+ | 30+ | $0.09+ |

*Assuming 1 storyboard per video

**Key Insights:**
- **Average creator**: 7 Shorts/month → 7 storyboards → **$0.028/month cost**
- **Successful creator**: 12-16 Shorts/month → 12-16 storyboards → **$0.05/month cost**
- **Top performer**: 18-22 Shorts/month → 18-22 storyboards → **$0.07/month cost**

**Source**: Top creators publish 18-22 Shorts monthly, more than double the average of 7, because the algorithm rewards consistency over six months with 44% more growth. ([YouTube Shorts Statistics 2026](https://www.loopexdigital.com/blog/youtube-shorts-statistics))

---

### Usage Multipliers

Many creators will generate **multiple storyboards per video**:
- Test different hooks (3-4 variants)
- Iterate on beat structure (2-3 revisions)
- A/B test different formats

**Realistic usage**: 2-3x multiplier
- Average creator: 7 videos × 2.5 iterations = **17.5 storyboards/month** → $0.07/month
- Professional creator: 20 videos × 2.5 iterations = **50 storyboards/month** → $0.20/month

**Even with 50 storyboards/month, API cost is only $0.20/month**

---

## 3. Competitor Pricing & Market Benchmarks

### Direct Competitors (Storyboard/Video Planning Tools)

| Tool | Pricing | Features |
|------|---------|----------|
| **Storyboarder.ai** | $39/month | AI storyboard generation |
| **Pictory** | $19-99/month | Video editing + AI |
| **Animoto** | $19-79/month | Video creation + templates |
| **LTX Studio** | Free tier + paid | AI-powered storyboarding |
| **Boords** | $29-109/month | Professional storyboarding |

**Sources**:
- [Storyboarder.ai Pricing](https://www.saasworthy.com/product/storyboarder-ai)
- [Best Storyboarding Software 2026](https://boords.com/best-storyboard-software)

---

### Video Editing SaaS (Indirect Competitors)

| Category | Price Range |
|----------|-------------|
| **Entry-level tools** | $10-30/month |
| **Mid-tier platforms** | $30-80/month |
| **Professional suites** | $80-300/month |
| **Freelance editor rates** | $50-150/hour |

**Project-based pricing**:
- Short social clips: $100-500
- YouTube content: $500-2,500
- Complex campaigns: $2,500-7,500+

**Source**: [Freelance Video Editing Rates 2026](https://www.cutjamm.com/blog/video-editing-rates)

---

### Creator Willingness to Pay

Research shows:
- **43% of enterprise buyers** consider outcome-based pricing a significant factor
- **Budget-conscious creators** prefer annual plans with locked pricing
- **Value perception**: If a tool saves 2-4 hours per video, creators justify $30-100/month

**Source**: [SaaS Pricing Models 2026](https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models)

---

## 4. Current Shorta Pricing Analysis

### Existing Pricing

| Plan | Price | Monthly Equivalent | Target User |
|------|-------|-------------------|-------------|
| **Free Trial** | $0 | $0 | 1 analysis, test users |
| **Pro** | $99/year | $8.25/month | Active creators |
| **Lifetime** | $199 one-time | $4.15/month (4 years) | Early adopters |

**Strengths**:
- ✅ Extremely affordable compared to competitors ($8.25/mo vs $39+/mo)
- ✅ Annual pricing reduces churn
- ✅ "Locked forever" messaging creates urgency
- ✅ Lifetime plan builds loyal community

**Weaknesses**:
- ❌ Leaving significant money on the table (90%+ gross margin)
- ❌ No usage tiers (power users pay same as casual users)
- ❌ Lifetime plan unsustainable long-term
- ❌ No monthly option (barrier for trial converts)

---

## 5. Unit Economics & Margin Analysis

### Cost Breakdown Per User (Annual)

**Scenario: Average Professional Creator (20 storyboards/month)**

| Cost Component | Monthly | Annual |
|----------------|---------|--------|
| **Gemini API** | $0.08 | $0.96 |
| **Supabase (est.)** | $0.05 | $0.60 |
| **Cloudflare Workers (est.)** | $0.02 | $0.24 |
| **Stripe fees (2.9% + $0.30)** | - | $3.17 |
| **Total COGS** | ~$0.15 | **~$5.00** |

**Pro Plan Revenue**: $99/year

**Gross Margin**: ($99 - $5) / $99 = **94.9%**

---

### Power User Scenario (100 storyboards/month)

| Cost Component | Monthly | Annual |
|----------------|---------|--------|
| **Gemini API** | $0.40 | $4.80 |
| **Supabase (est.)** | $0.10 | $1.20 |
| **Cloudflare Workers (est.)** | $0.03 | $0.36 |
| **Stripe fees** | - | $3.17 |
| **Total COGS** | ~$0.53 | **~$9.50** |

**Gross Margin**: ($99 - $9.50) / $99 = **90.4%**

---

### Key Insight

**Even power users (100 storyboards/month) cost only $9.50/year to serve**

This means:
- Current pricing has massive headroom
- Can support freemium model sustainably
- Can offer premium tiers at higher price points
- API costs are NOT a constraint

---

## 6. Pricing Recommendations

### Option A: Conservative Update (Minimal Change)

Keep existing structure, add monthly option:

| Plan | Price | Target |
|------|-------|--------|
| **Free** | $0 | 3 storyboards/month |
| **Pro Monthly** | $15/month | Active creators |
| **Pro Annual** | $120/year ($10/mo) | Save 33% |
| **Lifetime** | $299 one-time | Limited seats |

**Impact**:
- Monthly option reduces barrier to entry
- Annual plan stays competitive
- Lifetime price increase captures more value
- Estimated 20-30% revenue increase

---

### Option B: Value-Based Tiers (Recommended)

Align pricing with creator segments:

| Plan | Price | Storyboards/mo | Target |
|------|-------|----------------|--------|
| **Free** | $0 | 3 | Trial users |
| **Starter** | $19/month or $180/year | 30 | Casual creators (4-7 videos/mo) |
| **Pro** | $39/month or $390/year | 100 | Active creators (12-20 videos/mo) |
| **Business** | $79/month or $790/year | Unlimited | Agencies, power users |

**Features differentiation**:
- **Starter**: Basic storyboards, 4 hook variants, standard support
- **Pro**: + Viral pattern analysis, priority generation, collaboration tools
- **Business**: + White-label, API access, team seats, custom integrations

**Impact**:
- Captures more value from power users
- Clearer value proposition per segment
- Estimated 3-4x revenue increase
- Still 85-95% gross margins

---

### Option C: Hybrid Model (Growth-Focused)

Freemium base + usage overage:

| Plan | Base Price | Included | Overage |
|------|-----------|----------|---------|
| **Free** | $0 | 5/month | N/A |
| **Pro** | $29/month | 50/month | $0.50/storyboard |
| **Business** | $99/month | 300/month | $0.30/storyboard |

**Impact**:
- Predictable revenue for most users
- High-usage users pay incrementally
- Aligns pricing with value delivered
- Most SaaS-friendly model for investors

---

## 7. Final Recommendations

### Immediate Actions (Next 30 Days)

1. **Add Monthly Option** - $15/month Pro plan
   - Low-risk, quick implementation
   - Tests willingness to pay monthly
   - Improves conversion from free trial

2. **Increase Lifetime Price** - $199 → $299
   - Captures more value while still attractive
   - Creates urgency ("price increases March 1")

3. **Improve Value Communication**
   - Position as "Director's AI Assistant" not just "storyboard tool"
   - Highlight time savings: "Plan a week of content in 1 hour"
   - Show ROI: "$39/month vs $500/video for editor"

---

### Medium-Term (Q2 2026)

4. **Launch Tiered Pricing**
   - Starter ($19-24/mo), Pro ($39-49/mo), Business ($79-99/mo)
   - Test different price points with cohorts
   - Add premium features: collaboration, analytics, templates

5. **Implement Usage Tracking**
   - Dashboard showing storyboards used/remaining
   - Upgrade prompts at 80% usage
   - Clear overage pricing

---

### Long-Term Strategy

6. **Enterprise Plan**
   - Custom pricing for agencies/studios
   - API access, white-label, team management
   - Target: $500-2,000/month contracts

7. **Marketplace/Templates**
   - Sell proven storyboard templates ($5-20 each)
   - Creator revenue share (70/30 split)
   - Additional revenue stream beyond subscriptions

---

## 8. Key Metrics to Track

### Unit Economics
- [ ] Average storyboards per user per month
- [ ] API cost per storyboard (should stay ~$0.003)
- [ ] COGS per user (target: <$10/year)
- [ ] LTV:CAC ratio (target: >3:1)

### Pricing Effectiveness
- [ ] Conversion rate by plan
- [ ] Upgrade rate (Free → Paid)
- [ ] Churn rate by plan
- [ ] Average Revenue Per User (ARPU)

### Product Engagement
- [ ] Storyboards generated per session
- [ ] Feature usage (analyze video vs create from scratch)
- [ ] Re-hook/variant usage rate
- [ ] Return usage (daily/weekly active users)

---

## 9. Competitive Advantages for Premium Pricing

Shorta can justify higher pricing because:

1. **AI-Powered Video Analysis**
   - Competitors mostly do text-based storyboarding
   - Shorta analyzes actual YouTube Shorts with Gemini vision

2. **Director's Notes + Multi-Format Output**
   - Not just storyboard, but actionable shooting instructions
   - Beat-by-beat breakdown with retention analysis

3. **Hook Variants + Re-Hook System**
   - 4 AI-generated hook alternatives
   - Custom re-hook with emotional/specific/question presets

4. **Viral Pattern Analysis**
   - Learns from top-performing videos in niche
   - Applies proven patterns to new content

5. **Time Savings**
   - Manual storyboarding: 2-4 hours
   - Shorta: 5-10 minutes
   - Value: $50-150 saved per video (at freelancer rates)

---

## 10. Risk Mitigation

### API Cost Spikes
- **Current mitigation**: Variable FPS, context caching, rate limiting
- **Additional safeguards**:
  - Set usage caps per tier
  - Alert at 80% monthly budget
  - Implement queueing for batch processing

### Price Resistance
- **Grandfather existing users** at $99/year forever
- **Gradual rollout**: A/B test pricing with new cohorts
- **Clear value ladder**: Show what each tier unlocks

### Competitive Response
- **Differentiation**: Focus on YouTube Shorts expertise
- **Community**: Build creator network, templates, best practices
- **Speed**: Ship features faster (hook analyzer, A/B testing, analytics)

---

## Summary

### The Numbers

| Metric | Value |
|--------|-------|
| **Cost per storyboard** | $0.003 (0.3 cents) |
| **Average creator usage** | 7-20 storyboards/month |
| **Monthly API cost (typical user)** | $0.05-0.20 |
| **Annual COGS per user** | $5-10 |
| **Current gross margin** | 90-95% |
| **Market price point** | $19-79/month |
| **Recommended pricing** | $19-79/month tiered |
| **Revenue opportunity** | 3-5x current pricing |

---

### The Answer to Your Questions

1. **How much does it cost to generate 1 storyboard?**
   - **~$0.003 (0.3 cents)** on average
   - Range: $0.001-0.005 depending on video length and workflow

2. **How many storyboards do creators need per month?**
   - **Casual creators**: 4-7 storyboards
   - **Active creators**: 12-20 storyboards
   - **Professional creators**: 20-50+ storyboards
   - **Including iterations**: 2-3x multiplier (testing hooks, revisions)

3. **What should Shorta charge for subscription?**
   - **Current pricing ($8.25/mo)**: Too low, leaving money on table
   - **Recommended pricing**:
     - Starter: **$19-24/month** (30 storyboards)
     - Pro: **$39-49/month** (100 storyboards)
     - Business: **$79-99/month** (unlimited)
   - **Key insight**: Even at $39/month, gross margin is 92%+
   - **Market benchmark**: Competitors charge $39-109/month for similar tools

---

## Sources

### API Pricing
- [Google Gemini API Pricing 2026](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API Cost Calculator](https://costgoat.com/pricing/gemini-api)
- [Complete Cost Guide per 1M Tokens](https://www.metacto.com/blogs/the-true-cost-of-google-gemini-a-guide-to-api-pricing-and-integration)

### Creator Statistics
- [YouTube Shorts Statistics 2026](https://www.loopexdigital.com/blog/youtube-shorts-statistics)
- [YouTube Shorts Users & Demographics](https://www.demandsage.com/youtube-shorts-statistics/)
- [YouTube Upload Schedule Tips](https://support.google.com/youtube/answer/13616979)
- [How Many YouTube Shorts Should You Post Daily?](https://www.bigmotion.ai/blog/how-many-youtube-shorts-should-i-post-a-day)

### Market Pricing
- [Storyboarder.ai Features & Pricing](https://www.saasworthy.com/product/storyboarder-ai)
- [Best Storyboarding Software 2026](https://boords.com/best-storyboard-software)
- [Freelance Video Editing Rates](https://www.cutjamm.com/blog/video-editing-rates)
- [SaaS AI Pricing Models 2026](https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models)

---

**Document prepared by**: Claude (AI Research Agent)
**Date**: January 19, 2026
**Next Review**: Q2 2026 (after pricing experiments)
