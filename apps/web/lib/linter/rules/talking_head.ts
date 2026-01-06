import type { RuleSet } from '../types';

export const talkingHeadRules: RuleSet = {
  format: 'talking_head',
  rules: [
    // HOOK RULES
    {
      id: 'th_hook_timing',
      name: 'Hook Within 3 Seconds',
      description: 'The hook must grab attention within the first 3 seconds',
      severity: 'critical',
      category: 'hook',
      check: 'Does the video have a compelling hook in the first 0-3 seconds? Check for pattern interrupt, curiosity gap, or bold statement.',
    },
    {
      id: 'th_hook_generic_opener',
      name: 'Generic Opener',
      description: 'Hook starts with filler phrases like "Today I want to talk about..." or "In this video..."',
      severity: 'moderate',
      category: 'hook',
      check: 'Does the hook start with generic filler phrases instead of diving straight into the value?',
      goodExample: 'Start with the punchline directly: "Most people do X wrong. Here\'s the fix."',
      badExample: 'Avoid: "Today I want to talk about...", "In this video...", "So..."',
    },
    {
      id: 'gen_hook_clear_promise',
      name: 'No Clear Promise Early',
      description: 'Viewer is not told what they will get (promise/result/pain) within first 2 seconds',
      severity: 'moderate',
      category: 'hook',
      check: 'Within the first 2 seconds, is the viewer told what they will get? Is there a clear promise, result, or pain point stated?',
      goodExample: 'Add a one-line promise in first 1-2 seconds: "Here\'s how to X in Y minutes"',
      badExample: 'Vague openings without stating the outcome or benefit',
    },
    {
      id: 'th_hook_eye_contact',
      name: 'Direct Eye Contact in Hook',
      description: 'Speaker should make direct eye contact with camera during hook',
      severity: 'moderate',
      category: 'hook',
      check: 'Is the speaker looking directly at the camera during the first 3 seconds?',
    },
    {
      id: 'th_hook_energy',
      name: 'High Energy Opening',
      description: 'Hook should have noticeably higher energy than rest of video',
      severity: 'moderate',
      category: 'hook',
      check: 'Does the speaker show high energy, enthusiasm, or urgency in the opening?',
    },

    // VISUAL RULES
    {
      id: 'th_framing',
      name: 'Proper Framing',
      description: 'Subject should be properly framed (rule of thirds, headroom)',
      severity: 'minor',
      category: 'visual',
      check: 'Is the subject well-framed with appropriate headroom and following rule of thirds?',
    },
    {
      id: 'th_background_distraction',
      name: 'No Background Distractions',
      description: 'Background should be clean and not compete with speaker',
      severity: 'moderate',
      category: 'visual',
      check: 'Is the background clean and non-distracting? Any competing visual elements?',
    },
    {
      id: 'th_lighting',
      name: 'Good Lighting',
      description: 'Face should be well-lit and visible',
      severity: 'moderate',
      category: 'visual',
      check: 'Is the subject well-lit? Face clearly visible? No harsh shadows?',
    },

    // AUDIO RULES
    {
      id: 'th_audio_clarity',
      name: 'Clear Audio',
      description: 'Voice should be clear and easy to understand',
      severity: 'critical',
      category: 'audio',
      check: 'Is the audio clear? Any background noise, echo, or audio issues?',
    },
    {
      id: 'th_speaking_pace',
      name: 'Optimal Speaking Pace',
      description: 'Speaker should maintain engaging pace (not too slow or fast)',
      severity: 'moderate',
      category: 'pacing',
      check: 'Is the speaking pace optimal? Not too rushed or too slow?',
    },

    // RETENTION RULES
    {
      id: 'th_jump_cuts',
      name: 'Use Jump Cuts',
      description: 'Should use jump cuts to maintain pace and remove dead air',
      severity: 'minor',
      category: 'retention',
      check: 'Are jump cuts used effectively to remove pauses and maintain energy?',
    },
    {
      id: 'th_b_roll',
      name: 'Strategic B-Roll Usage',
      description: 'B-roll should be used to illustrate points and break monotony',
      severity: 'minor',
      category: 'retention',
      check: 'Is B-roll or visual aids used to illustrate key points? If talking head only, is it engaging enough?',
    },
    {
      id: 'th_duration',
      name: 'Optimal Duration',
      description: 'Talking head shorts should be 15-90 seconds for best retention',
      severity: 'moderate',
      category: 'structure',
      check: 'Is the video length appropriate? Aim for 15-90s for talking head content (YouTube Shorts support up to 180s).',
    },
    {
      id: 'gen_credibility_gap',
      name: 'Credibility Gap',
      description: 'Strong claim made without any proof, example, constraint, or demonstration',
      severity: 'moderate',
      category: 'retention',
      check: 'Are strong claims backed up with evidence, examples, numbers, or demonstrations? Or are they unsupported assertions?',
      goodExample: 'Add proof: numbers, mini-demo, before/after, or specific case',
      badExample: 'Making bold claims without any supporting evidence',
    },

    // STRUCTURE RULES
    {
      id: 'th_setup_too_long',
      name: 'Setup Too Long',
      description: 'Setup or background context exceeds 35% of total video duration',
      severity: 'critical',
      category: 'structure',
      check: 'Does the setup/background take up more than 35% of the video before getting to the main point?',
      goodExample: 'Replace background with one-line conclusion + example. Get to the point fast.',
      badExample: 'Spending the first third of the video on context or background',
    },
    {
      id: 'th_one_idea',
      name: 'Single Core Message',
      description: 'Video should focus on one clear idea or takeaway',
      severity: 'critical',
      category: 'structure',
      check: 'Does the video focus on ONE clear idea? Or does it try to cover too much?',
    },
    {
      id: 'gen_no_payoff',
      name: 'No Payoff / No Answer',
      description: 'Video ends without delivering the promised answer or result',
      severity: 'critical',
      category: 'structure',
      check: 'Does the video deliver on its promise? Is there a clear final takeaway, step, list, or conclusion?',
      goodExample: 'Add a clear final takeaway: a concrete step, list, or explicit conclusion',
      badExample: 'Video ends abruptly without answering the question posed in the hook',
    },

    // CTA RULES
    {
      id: 'th_cta_presence',
      name: 'Clear Call-to-Action',
      description: 'Should end with clear next step or CTA',
      severity: 'minor',
      category: 'cta',
      check: 'Is there a clear CTA or next step at the end? What should viewers do?',
    },
  ],

  promptTemplate: `You are a VIDEO LINTER for TALKING HEAD format short-form content.

Analyze the video against these specific rules. For EACH rule, determine if it PASSES or FAILS.

RULES TO CHECK:
{{RULES_LIST}}

For each violation found, provide:
1. Rule ID that was violated
2. Specific timestamp where issue occurs (if applicable)
3. What's wrong - be specific and reference actual content
4. How to fix it - use this format:
   - Start with action verb (Cut, Replace, Add, Move, Show, Start)
   - State exactly what to change
   - Give specific example if applicable
   - Keep under 15 words when possible
   - NO vague words: avoid "consider", "maybe", "try to", "could"
5. Confidence score (0.0-1.0)

SUGGESTION EXAMPLES (Good):
✓ "Cut the first 5 seconds. Start with: 'Most people waste money on...'"
✓ "Replace 'Today I want to talk about' with the main point directly"
✓ "Add eye contact with camera during 0:00-0:03"
✓ "Move the question from 0:05 to 0:00"

SUGGESTION EXAMPLES (Bad):
✗ "Consider making the hook more engaging" (too vague)
✗ "You should try to improve the energy" (not specific)
✗ "Maybe add some visual elements to make it better" (not actionable)

Return VALID JSON ONLY in this format:
{
  "violations": [
    {
      "ruleId": "th_hook_timing",
      "ruleName": "Hook Within 3 Seconds",
      "severity": "critical",
      "category": "hook",
      "message": "Hook appears at 0:05, which is too late",
      "timestamp": "0:05",
      "suggestion": "Cut 0:00-0:05. Start with: 'Want to know why 90% fail?'",
      "confidence": 0.95
    }
  ],
  "summary": "Brief 2-3 sentence summary of overall video quality and main issues"
}

Be direct. Use imperative verbs. Give specific examples.`,
};
