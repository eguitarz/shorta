/**
 * AI-powered monetization analysis for YouTube channels.
 * Analyzes niche, audience, and channel stats to provide market intelligence,
 * revenue estimates, and actionable monetization advice.
 */

import { GoogleGenAI } from '@google/genai';
import { appendLanguageInstruction } from '@/lib/i18n-helpers';
import type { MonetizationAnalysis } from './types';

interface MonetizationInput {
  primaryNiche: string;
  secondaryNiches: string[];
  contentThemes: string[];
  targetAudience: string;
  avgViewCount: number;
  subscriberCount: number;
  locale?: string;
}

const MONETIZATION_PROMPT = `You are a YouTube monetization consultant with deep knowledge of creator economics, CPM rates, and niche profitability.

Analyze the following YouTube Shorts channel and provide a comprehensive monetization review.

**Channel Data:**
- Primary Niche: {primaryNiche}
- Secondary Niches: {secondaryNiches}
- Content Themes: {contentThemes}
- Target Audience: {targetAudience}
- Average View Count per Short: {avgViewCount}
- Subscriber Count: {subscriberCount}

**Your analysis must cover:**

1. **Market Size** — How large is the addressable audience for this niche? Consider total TAM of viewers and advertisers willing to pay for this audience.
2. **Estimated CPM Range** — What CPM range (in USD) do channels in this niche typically see on YouTube Shorts? Consider that Shorts CPMs are generally lower than long-form.
3. **Monthly Revenue Estimate** — Based on the channel's average views and the CPM range, estimate monthly ad revenue range.
4. **Competition Level** — How saturated is this niche? Are there too many creators or is there room to grow?
5. **Growth Potential** — Is this niche trending up, stable, or declining? Consider current trends.
6. **Monetization Strategies** — List 3-4 specific, actionable monetization strategies beyond just ad revenue (sponsorships, merch, courses, affiliate, etc.) tailored to this specific niche and audience.
7. **Recommendation** — Should this creator stay in this niche? Give a direct, actionable answer.
8. **Niche Advice** — Tactical advice specific to their niche for maximizing revenue.
9. **Overall Confidence** — How confident are you in this analysis (0-1)? Be honest about uncertainty.

Return a JSON object with these exact fields:
- marketSize: "small" | "medium" | "large" | "massive"
- marketSizeReasoning: brief explanation
- estimatedCpmRange: { low: number, high: number } (USD)
- monthlyRevenueEstimate: { low: number, high: number } (USD)
- competitionLevel: "low" | "medium" | "high" | "saturated"
- competitionReasoning: brief explanation
- growthPotential: "declining" | "stable" | "growing" | "explosive"
- growthPotentialReasoning: brief explanation
- overallConfidence: number between 0 and 1
- confidenceReasoning: brief explanation of confidence level
- monetizationStrategies: array of 3-4 specific strategy strings
- recommendation: actionable paragraph about whether to stay in niche
- nicheAdvice: tactical advice paragraph for their specific niche`;

export async function analyzeMonetization(
  input: MonetizationInput
): Promise<MonetizationAnalysis | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required for monetization analysis');
  }

  const basePrompt = MONETIZATION_PROMPT
    .replace('{primaryNiche}', input.primaryNiche)
    .replace('{secondaryNiches}', input.secondaryNiches.join(', ') || 'None')
    .replace('{contentThemes}', input.contentThemes.join(', ') || 'None')
    .replace('{targetAudience}', input.targetAudience || 'General')
    .replace('{avgViewCount}', input.avgViewCount.toLocaleString())
    .replace('{subscriberCount}', input.subscriberCount.toLocaleString());

  const prompt = appendLanguageInstruction(basePrompt, input.locale);

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonStr = response.text?.trim();
    console.log('[monetization-analysis] Raw response:', jsonStr?.slice(0, 500));
    if (!jsonStr) {
      console.error('[monetization-analysis] Empty response from Gemini');
      return null;
    }

    const result = JSON.parse(jsonStr) as MonetizationAnalysis;

    // Validate required fields
    if (
      !result.marketSize ||
      !result.competitionLevel ||
      !result.growthPotential ||
      typeof result.overallConfidence !== 'number'
    ) {
      console.error('[monetization-analysis] Invalid result:', result);
      return null;
    }

    return result;
  } catch (error) {
    console.error('[monetization-analysis] Failed:', error);
    return null;
  }
}
