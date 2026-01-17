/**
 * Predefined hook types for YouTube Shorts analysis
 * These categories cover common patterns used in successful short-form content
 */

export const HOOK_TYPES = {
  OUTCOME_FIRST: 'Outcome-first',
  RELATABLE_PAIN: 'Relatable pain',
  CONTRADICTION: 'Contradiction / Myth-busting',
  SHOCK: 'Shock / Bold claim',
  CURIOSITY_GAP: 'Curiosity gap',
  AUTHORITY: 'Authority / Credibility',
  SPECIFICITY: 'Specific number / specificity',
  DIRECT_CALLOUT: 'Direct call-out',
  PATTERN_INTERRUPT: 'Pattern interrupt (verbal)',
  BEFORE_AFTER: 'Before / After contrast',
  TIME_BOUND: 'Time-bound promise',
  NEGATIVE_FRAMING: 'Negative framing',
  QUESTION: 'Question hook',
  OTHER: 'Other',
} as const;

/**
 * Array of all predefined hook types for validation and iteration
 */
export const HOOK_TYPE_VALUES = Object.values(HOOK_TYPES);

/**
 * TypeScript type for hook categories
 */
export type HookCategory = (typeof HOOK_TYPES)[keyof typeof HOOK_TYPES];

/**
 * Hook type descriptions for LLM prompts and documentation
 */
export const HOOK_TYPE_DESCRIPTIONS: Record<HookCategory, string> = {
  [HOOK_TYPES.OUTCOME_FIRST]: 'Promises result/benefit upfront',
  [HOOK_TYPES.RELATABLE_PAIN]: 'Surfaces unspoken viewer struggle',
  [HOOK_TYPES.CONTRADICTION]: 'Challenges common belief',
  [HOOK_TYPES.SHOCK]: 'Extreme/counterintuitive statement',
  [HOOK_TYPES.CURIOSITY_GAP]: 'Incomplete info forces continuation',
  [HOOK_TYPES.AUTHORITY]: 'Establishes expertise quickly',
  [HOOK_TYPES.SPECIFICITY]: 'Uses concrete data/metrics',
  [HOOK_TYPES.DIRECT_CALLOUT]: 'Targets specific audience segment',
  [HOOK_TYPES.PATTERN_INTERRUPT]: 'Unusual delivery/phrasing',
  [HOOK_TYPES.BEFORE_AFTER]: 'Shows transformation',
  [HOOK_TYPES.TIME_BOUND]: 'Emphasizes speed/urgency',
  [HOOK_TYPES.NEGATIVE_FRAMING]: 'Leads with mistake/risk',
  [HOOK_TYPES.QUESTION]: 'Poses unspoken viewer question',
  [HOOK_TYPES.OTHER]: 'Mixed or unique approach',
};

/**
 * Validates if a string is a valid hook category
 */
export function isValidHookCategory(category: string): category is HookCategory {
  return HOOK_TYPE_VALUES.includes(category as HookCategory);
}

/**
 * Gets a hook category, defaulting to 'Other' if invalid
 */
export function normalizeHookCategory(category: string | undefined | null): HookCategory {
  if (!category) return HOOK_TYPES.OTHER;
  return isValidHookCategory(category) ? category : HOOK_TYPES.OTHER;
}

/**
 * Formats hook types for LLM prompts
 */
export function formatHookTypesForPrompt(): string {
  return Object.values(HOOK_TYPES)
    .map((type, index) => {
      const description = HOOK_TYPE_DESCRIPTIONS[type];
      return `${index + 1}. **${type}** - ${description}`;
    })
    .join('\n');
}
