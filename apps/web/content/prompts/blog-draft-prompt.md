# Blog Post Draft Prompt — Creator Analysis

Use this prompt template to generate a draft blog post analyzing a famous YouTuber's video with Shorta.

## Instructions for AI

Write a blog post analyzing [CREATOR_NAME]'s video "[VIDEO_TITLE]" using Shorta's AI video analysis.

**Tone:** Direct, specific, data-backed. No fluff, no generic advice. Write as if explaining to a creator with 50K subs who wants to understand what separates their content from a 5M-sub creator in the same niche.

**Template:**

```markdown
---
title: "Why [CREATOR]'s [VIDEO_TYPE] Gets [X] Views: AI Frame Analysis"
description: "[1-2 sentence SEO description focusing on the key pattern discovered]"
publishedAt: "YYYY-MM-DD"
author: "Dale Ma"
categories: ["creator-analysis", "youtube-strategy"]
tags: ["[creator name]", "[niche]", "video analysis", "retention"]
coverImage: "/blog/[slug]/og-report.png"
featured: false
readingTime: "X min read"
faqs:
  - question: "[Question about the creator's technique]"
    answer: "[Specific answer based on analysis data]"
  - question: "[Question about applying this to other videos]"
    answer: "[Actionable answer]"
---

## The Video

[YouTube embed iframe of the video being analyzed]

[1-2 sentences of context: channel size, niche, why this video is interesting (overperformed, underperformed, unusual technique)]

<!-- shorta-report:JOB_ID creator="[CREATOR_NAME]" title="[VIDEO_TITLE]" -->

## The Pattern: [Key Insight in 5-8 words]

[The main editorial insight. What this creator does that others don't. This is the value of the post. Not the scores, but the WHY behind them. 2-3 paragraphs.]

## Frame-by-Frame Breakdown

### [Key Moment 1: e.g., "The Hook (0:00-0:03)"]

![Frame screenshot](/blog/[slug]/frame-01-hook.png)

[What Gemini's visual analysis found at this moment. What the creator did with framing, text, movement, or expression that a human reviewer might miss. 1-2 paragraphs.]

### [Key Moment 2]

![Frame screenshot](/blog/[slug]/frame-02-pattern.png)

[Analysis of second key moment. Connect to the overall pattern.]

### [Key Moment 3 (optional)]

[If there's a third significant moment worth highlighting.]

## How This Applies to Your Videos

1. **[Specific takeaway 1]** — [How to apply it, with concrete example]
2. **[Specific takeaway 2]** — [How to apply it]
3. **[Specific takeaway 3]** — [How to apply it]

## Try It Yourself

Want to see how your videos score? Shorta's AI analyzes your video frame-by-frame, just like we did with [CREATOR_NAME]'s content above.

[Analyze Your Video →](https://shorta.ai)
```

## Data to include in the prompt

When generating a draft, provide the AI with:

1. **Raw analysis data from Shorta:**
   - Overall score and category scores (Hook, Structure, Clarity, Delivery)
   - Key issues found (critical, moderate, minor)
   - Beat-by-beat breakdown highlights
   - Frame analysis observations

2. **Creator context:**
   - Channel name and subscriber count
   - Content niche
   - Typical video style and length
   - Why this specific video was chosen

3. **The pattern you identified:**
   - What makes this video interesting
   - The insight you want the post to communicate
   - How it connects to broader creator strategy

4. **Shareable report job_id:**
   - The Shorta job ID for the `<!-- shorta-report:JOB_ID -->` placeholder
