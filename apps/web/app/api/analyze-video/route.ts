import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/;
    const isYouTube = youtubeRegex.test(url);

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    let response;

    if (isYouTube && client.analyzeVideo) {
      // Use native Gemini YouTube video analysis (uses gemini-2.5-flash)
      const prompt = `You are an expert YouTube Shorts director. Analyze the provided YouTube Short and reverse-engineer it into a detailed production storyboard.

First, understand the full video structure, then break it down into natural sections with actual timestamps.

---

## VIDEO OVERVIEW

Title: [Video title if available]
Length: [Total duration in seconds]
Views/Engagement: [If available]
Primary Hook Pattern: [e.g., "Confession + Specific Outcome", "Shocking Statistic", "Relatability + Problem", "Before/After Transformation"]
Content Type: [e.g., Talking head, Screen recording, B-roll montage, Mixed]
Target Audience: [Infer from content and style]

---

## STORYBOARD BREAKDOWN

[Dynamically identify sections - could be 3-7 sections depending on video length and structure. Use actual timestamps from the video.]

### SECTION 1: HOOK ([Start]-[End]s)

Pattern Used: [Identify the specific viral pattern]

💬 Script:
"[Exact words spoken - can be multiple lines if needed]"

📸 Shot Description:
[Detailed description: camera angle, framing, subject positioning, any movement]

🎭 Delivery Notes:
- Tone: [e.g., Urgent, conversational, excited, vulnerable, authoritative]
- Pacing: [e.g., Fast, moderate, slow build]
- Emphasis: [Specific words/phrases emphasized and how]
- Vocal techniques: [e.g., Voice inflection, pauses, volume changes]

📝 Visual Elements:
[Any text overlays, graphics, transitions, cuts]

✅ Why This Works:
[Explain the psychological trigger - what makes viewers stop scrolling and keep watching]

⚠️ CRITICAL RETENTION RISK: [Be honest: Is the visual too static? Is the delivery too slow? Is the information redundant? Explain exactly why a viewer would swipe away here.]

🚀 DIRECT OPTIMIZATION SUGGESTIONS (Optional, not required for every fix):
Visual Fix: [e.g., "Add a 1.1x zoom punch-in," "Overlay a specific stat screenshot here."]
Audio/Pacing Fix: [e.g., "Cut the 0.5s silence," "Add a high-frequency transition sound."]
Script Fix: [e.g., "Remove 'I think', replace with 'The data shows'."]

---

### SECTION 2: [NAME THE SECTION] ([Start]-[End]s)

[e.g., "Problem Setup", "Credibility Builder", "Story Development", "Tension Build"]

💬 Script:
"[Exact words spoken]"

📸 Shot Description:
[Visual details and any changes from previous section]

🎭 Delivery Notes:
- Tone: [Any shifts in tone]
- Pacing: [Changes in speaking speed]
- Emphasis: [Key words/phrases]
- Energy: [High/medium/low, any changes]

📝 Visual Elements:
[Cuts, B-roll, text, graphics, transitions]

🎯 Purpose:
[What this section accomplishes - builds credibility, creates tension, provides context, etc.]

⚠️ CRITICAL RETENTION RISK: [Be honest: Is the visual too static? Is the delivery too slow? Is the information redundant? Explain exactly why a viewer would swipe away here.]

🚀 DIRECT OPTIMIZATION SUGGESTIONS (Optional, not required for every fix):
Visual Fix: [e.g., "Add a 1.1x zoom punch-in," "Overlay a specific stat screenshot here."]
Audio/Pacing Fix: [e.g., "Cut the 0.5s silence," "Add a high-frequency transition sound."]
Script Fix: [e.g., "Remove 'I think', replace with 'The data shows'."]

---

[Continue with additional sections as needed - don't force a specific number]

### SECTION N: PAYOFF/CTA ([Start]-[End]s)

💬 Script:
"[Exact words including call-to-action]"

📸 Shot Description:
[Final visual setup]

🎭 Delivery Notes:
- Tone:
- Pacing:
- Emphasis:
- Closing technique:

📝 Visual Elements:
[Final graphics, text overlays, end screens]

🎯 Purpose:
[How it drives action - comment, follow, rewatch, share]

⚠️ CRITICAL RETENTION RISK: [Be honest: Is the visual too static? Is the delivery too slow? Is the information redundant? Explain exactly why a viewer would swipe away here.]

🚀 DIRECT OPTIMIZATION SUGGESTIONS (Optional, not required for every fix):
Visual Fix: [e.g., "Add a 1.1x zoom punch-in," "Overlay a specific stat screenshot here."]
Audio/Pacing Fix: [e.g., "Cut the 0.5s silence," "Add a high-frequency transition sound."]
Script Fix: [e.g., "Remove 'I think', replace with 'The data shows'."]

---

## PERFORMANCE ANALYSIS

### Retention Drivers
1. [First key element that keeps viewers watching]
2. [Second element]
3. [Third element]

### Pacing Strategy
[How the video maintains momentum - fast cuts, story progression, escalating tension, etc.]

### Visual Engagement Tactics
[Text overlays, zoom cuts, B-roll timing, pattern interrupts, etc.]

### Delivery Style
Overall approach: [Conversational/Educational/Entertaining/Vulnerable/Authoritative]

Key characteristics:
- [Specific technique 1]
- [Specific technique 2]
- [Specific technique 3]

---

## STORYBOARD SCORE: X.X/10

Hook Strength (0-4): X.X
[Brief explanation]

Structure & Pacing (0-3): X.X
[Brief explanation]

Delivery & Performance (0-3): X.X
[Brief explanation]

Total: X.X/10

---

## REPLICATION BLUEPRINT

✅ Elements to Keep (Universal):
- [Specific techniques that work across niches]
- [Pattern structures to maintain]
- [Timing/pacing elements]

🔄 Elements to Adapt (Customize):
- [What to change for different topics]
- [How to personalize the delivery]
- [Niche-specific adjustments]

❌ Common Mistakes to Avoid:
- [What would ruin this pattern]
- [Pitfalls when replicating]

---

## PATTERN VARIATIONS

This same pattern could work for:
1. [Different topic/niche 1]
2. [Different topic/niche 2]
3. [Different topic/niche 3]

Example adaptation: [One specific example of how to adapt this pattern to a different use case]

---

Now analyze the video and generate the complete storyboard.`;

      response = await client.analyzeVideo(url, prompt);
    } else {
      // For non-YouTube URLs, try to fetch and analyze content
      let pageContent = '';
      try {
        const fetchResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Shorta/1.0; +https://shorta.ai)',
          },
        });

        if (fetchResponse.ok) {
          const html = await fetchResponse.text();
          pageContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);
        }
      } catch (error) {
        console.error('Error fetching URL:', error);
      }

      response = await client.chat([
        {
          role: 'user',
          content: `Analyze this content and provide a summary with key insights:

${pageContent || 'No content could be fetched from the URL.'}

Provide a structured analysis with actionable recommendations.`,
        },
      ]);
    }

    return NextResponse.json({
      url,
      analysis: response.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Analyze video API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
