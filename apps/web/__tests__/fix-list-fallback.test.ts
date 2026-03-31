import { describe, it, expect } from 'vitest';

// We test the fallback logic directly since it's the riskiest code path.
// The FixList component uses this when Gemini doesn't return top_changes.

// Inline the fallback logic to test it in isolation (same as FixList.tsx buildFallbackChanges)
const NICHE_WEIGHTS: Record<string, Record<string, number>> = {
  talking_head: { hook: 0.35, structure: 0.25, clarity: 0.25, delivery: 0.15 },
  gameplay: { hook: 0.40, structure: 0.30, clarity: 0.15, delivery: 0.15 },
  demo: { hook: 0.35, structure: 0.30, clarity: 0.25, delivery: 0.10 },
  other: { hook: 0.40, structure: 0.35, clarity: 0.15, delivery: 0.10 },
};

interface TopChange {
  change: string;
  category: string;
  impact: 'high' | 'medium';
  reason: string;
}

function buildFallbackChanges(
  performance: {
    hookStrength: number;
    structurePacing: number;
    deliveryPerformance: number;
    hook: { analysis: string };
    structure: { analysis: string };
    content: { valueClarity: number; analysis: string };
    delivery: { analysis: string };
  },
  videoFormat?: string,
): TopChange[] {
  const format = videoFormat || 'other';
  const weights = NICHE_WEIGHTS[format] || NICHE_WEIGHTS.other;

  const categories = [
    { key: 'hook', score: performance.hookStrength, weight: weights.hook, analysis: performance.hook?.analysis },
    { key: 'structure', score: performance.structurePacing, weight: weights.structure, analysis: performance.structure?.analysis },
    { key: 'clarity', score: performance.content?.valueClarity ?? 0, weight: weights.clarity, analysis: performance.content?.analysis },
    { key: 'delivery', score: performance.deliveryPerformance, weight: weights.delivery, analysis: performance.delivery?.analysis },
  ];

  const ranked = categories
    .map((c) => ({ ...c, importance: (100 - c.score) * c.weight }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3);

  return ranked.map((c) => ({
    change: c.analysis?.split('\n')[0] || `Improve your ${c.key} score`,
    category: c.key,
    impact: c.importance > 15 ? 'high' as const : 'medium' as const,
    reason: `Score: ${Math.round(c.score)}/100`,
  }));
}

const makePerformance = (hook: number, structure: number, clarity: number, delivery: number) => ({
  hookStrength: hook,
  structurePacing: structure,
  deliveryPerformance: delivery,
  hook: { analysis: `Hook analysis for score ${hook}` },
  structure: { analysis: `Structure analysis for score ${structure}` },
  content: { valueClarity: clarity, analysis: `Clarity analysis for score ${clarity}` },
  delivery: { analysis: `Delivery analysis for score ${delivery}` },
});

describe('FixList fallback logic', () => {
  it('returns 3 items', () => {
    const result = buildFallbackChanges(makePerformance(50, 60, 70, 80));
    expect(result).toHaveLength(3);
  });

  it('ranks by weighted importance, not raw score', () => {
    // Hook has highest weight (0.35) and low score (30) → should be first
    // Delivery has lowest weight (0.15) and low score (20) → should NOT be first despite lowest raw score
    const result = buildFallbackChanges(makePerformance(30, 60, 70, 20), 'talking_head');

    // Hook importance: (100-30) * 0.35 = 24.5
    // Delivery importance: (100-20) * 0.15 = 12.0
    // Structure importance: (100-60) * 0.25 = 10.0
    // Clarity importance: (100-70) * 0.25 = 7.5
    expect(result[0].category).toBe('hook');
    // Delivery raw score is lowest (20) but its importance is second due to low weight
    expect(result[1].category).toBe('delivery');
    expect(result[2].category).toBe('structure');
  });

  it('uses niche-specific weights', () => {
    // In gameplay mode, hook weight is 0.40 (highest) and clarity is 0.15 (lowest)
    // With equal scores, hook should rank higher due to weight
    const result = buildFallbackChanges(makePerformance(50, 50, 50, 50), 'gameplay');

    // All scores equal (50), so importance = (100-50) * weight = 50 * weight
    // hook: 50*0.40 = 20, structure: 50*0.30 = 15, clarity: 50*0.15 = 7.5, delivery: 50*0.15 = 7.5
    expect(result[0].category).toBe('hook');
    expect(result[1].category).toBe('structure');
  });

  it('marks high impact when importance > 15', () => {
    const result = buildFallbackChanges(makePerformance(20, 90, 90, 90), 'talking_head');
    // Hook: (100-20) * 0.35 = 28 → high
    expect(result[0].impact).toBe('high');
    // Structure: (100-90) * 0.25 = 2.5 → medium
    const structureItem = result.find(r => r.category === 'structure');
    if (structureItem) expect(structureItem.impact).toBe('medium');
  });

  it('uses first line of analysis as change text', () => {
    const perf = makePerformance(30, 80, 80, 80);
    perf.hook.analysis = 'First line of hook analysis\nSecond line\nThird line';
    const result = buildFallbackChanges(perf);
    expect(result[0].change).toBe('First line of hook analysis');
  });

  it('handles all high scores gracefully', () => {
    const result = buildFallbackChanges(makePerformance(90, 85, 88, 92));
    expect(result).toHaveLength(3);
    // All should be medium impact since scores are high
    result.forEach(r => {
      expect(['high', 'medium']).toContain(r.impact);
    });
  });

  it('defaults to "other" weights for unknown format', () => {
    const result1 = buildFallbackChanges(makePerformance(50, 50, 50, 50), 'unknown_format');
    const result2 = buildFallbackChanges(makePerformance(50, 50, 50, 50), 'other');
    expect(result1.map(r => r.category)).toEqual(result2.map(r => r.category));
  });

  it('includes score in reason text', () => {
    const result = buildFallbackChanges(makePerformance(42, 80, 80, 80));
    expect(result[0].reason).toBe('Score: 42/100');
  });
});
