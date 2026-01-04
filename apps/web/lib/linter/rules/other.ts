import type { RuleSet } from '../types';

export const otherRules: RuleSet = {
  format: 'other',
  rules: [
    // HOOK RULES
    {
      id: 'ot_hook_timing',
      name: 'Hook Within 3 Seconds',
      description: 'Must grab attention within first 3 seconds',
      severity: 'critical',
      category: 'hook',
      check: 'Does the video have a compelling hook in the first 0-3 seconds?',
    },

    // VISUAL RULES
    {
      id: 'ot_visual_interest',
      name: 'Consistent Visual Interest',
      description: 'Visuals should maintain interest throughout',
      severity: 'moderate',
      category: 'visual',
      check: 'Are the visuals consistently interesting? Any boring static moments?',
    },
    {
      id: 'ot_visual_quality',
      name: 'Good Visual Quality',
      description: 'Video should be well-lit, in-focus, and high quality',
      severity: 'moderate',
      category: 'visual',
      check: 'Is the video quality good? Proper lighting? In focus?',
    },

    // AUDIO RULES
    {
      id: 'ot_audio_quality',
      name: 'Clear Audio',
      description: 'Audio should be clear and well-mixed',
      severity: 'critical',
      category: 'audio',
      check: 'Is audio clear? Any background noise or mixing issues?',
    },

    // PACING RULES
    {
      id: 'ot_pacing',
      name: 'Fast Pacing',
      description: 'Short-form content requires fast pacing',
      severity: 'moderate',
      category: 'pacing',
      check: 'Is the pacing fast enough for short-form? Any slow moments?',
    },
    {
      id: 'ot_cuts',
      name: 'Dynamic Editing',
      description: 'Should use cuts to maintain energy',
      severity: 'minor',
      category: 'pacing',
      check: 'Are cuts used effectively to maintain pace and energy?',
    },

    // RETENTION RULES
    {
      id: 'ot_payoff',
      name: 'Clear Payoff',
      description: 'Should deliver on the hook promise',
      severity: 'critical',
      category: 'retention',
      check: 'Does the video deliver on what the hook promises?',
    },
    {
      id: 'ot_length',
      name: 'Appropriate Length',
      description: 'Should be 15-60 seconds based on content',
      severity: 'minor',
      category: 'structure',
      check: 'Is the video length appropriate for the content type?',
    },

    // STRUCTURE RULES
    {
      id: 'ot_clear_message',
      name: 'Clear Core Message',
      description: 'Video should have one clear message or purpose',
      severity: 'moderate',
      category: 'structure',
      check: 'Is there a clear message or purpose? Not too scattered?',
    },
  ],

  promptTemplate: `You are a VIDEO LINTER for general short-form content.

Analyze the video against these specific rules. For EACH rule, determine if it PASSES or FAILS.

RULES TO CHECK:
{{RULES_LIST}}

For each violation found, provide:
1. Rule ID that was violated
2. Specific timestamp where issue occurs (if applicable)
3. Clear description of what's wrong
4. Actionable suggestion to fix it
5. Confidence score (0.0-1.0)

Return VALID JSON ONLY in this format:
{
  "violations": [
    {
      "ruleId": "ot_hook_timing",
      "ruleName": "Hook Within 3 Seconds",
      "severity": "error",
      "category": "hook",
      "message": "First 3 seconds show intro text with no hook",
      "timestamp": "0:00-0:03",
      "suggestion": "Remove intro card. Start with the most interesting moment",
      "confidence": 0.92
    }
  ],
  "summary": "Brief 2-3 sentence summary of overall video quality and main issues"
}

Be specific. Reference actual moments in the video. Provide actionable feedback.`,
};
