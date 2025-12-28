import type { RuleSet } from '../types';

export const talkingHeadRules: RuleSet = {
  format: 'talking_head',
  rules: [
    // HOOK RULES
    {
      id: 'th_hook_timing',
      name: 'Hook Within 3 Seconds',
      description: 'The hook must grab attention within the first 3 seconds',
      severity: 'error',
      category: 'hook',
      check: 'Does the video have a compelling hook in the first 0-3 seconds? Check for pattern interrupt, curiosity gap, or bold statement.',
    },
    {
      id: 'th_hook_eye_contact',
      name: 'Direct Eye Contact in Hook',
      description: 'Speaker should make direct eye contact with camera during hook',
      severity: 'warning',
      category: 'hook',
      check: 'Is the speaker looking directly at the camera during the first 3 seconds?',
    },
    {
      id: 'th_hook_energy',
      name: 'High Energy Opening',
      description: 'Hook should have noticeably higher energy than rest of video',
      severity: 'warning',
      category: 'hook',
      check: 'Does the speaker show high energy, enthusiasm, or urgency in the opening?',
    },

    // VISUAL RULES
    {
      id: 'th_framing',
      name: 'Proper Framing',
      description: 'Subject should be properly framed (rule of thirds, headroom)',
      severity: 'info',
      category: 'visual',
      check: 'Is the subject well-framed with appropriate headroom and following rule of thirds?',
    },
    {
      id: 'th_background_distraction',
      name: 'No Background Distractions',
      description: 'Background should be clean and not compete with speaker',
      severity: 'warning',
      category: 'visual',
      check: 'Is the background clean and non-distracting? Any competing visual elements?',
    },
    {
      id: 'th_lighting',
      name: 'Good Lighting',
      description: 'Face should be well-lit and visible',
      severity: 'warning',
      category: 'visual',
      check: 'Is the subject well-lit? Face clearly visible? No harsh shadows?',
    },

    // AUDIO RULES
    {
      id: 'th_audio_clarity',
      name: 'Clear Audio',
      description: 'Voice should be clear and easy to understand',
      severity: 'error',
      category: 'audio',
      check: 'Is the audio clear? Any background noise, echo, or audio issues?',
    },
    {
      id: 'th_speaking_pace',
      name: 'Optimal Speaking Pace',
      description: 'Speaker should maintain engaging pace (not too slow or fast)',
      severity: 'warning',
      category: 'pacing',
      check: 'Is the speaking pace optimal? Not too rushed or too slow?',
    },

    // RETENTION RULES
    {
      id: 'th_jump_cuts',
      name: 'Use Jump Cuts',
      description: 'Should use jump cuts to maintain pace and remove dead air',
      severity: 'info',
      category: 'retention',
      check: 'Are jump cuts used effectively to remove pauses and maintain energy?',
    },
    {
      id: 'th_b_roll',
      name: 'Strategic B-Roll Usage',
      description: 'B-roll should be used to illustrate points and break monotony',
      severity: 'info',
      category: 'retention',
      check: 'Is B-roll or visual aids used to illustrate key points? If talking head only, is it engaging enough?',
    },
    {
      id: 'th_duration',
      name: 'Optimal Duration',
      description: 'Talking head shorts should be 15-45 seconds',
      severity: 'warning',
      category: 'structure',
      check: 'Is the video length appropriate (15-45s for most topics)?',
    },

    // STRUCTURE RULES
    {
      id: 'th_one_idea',
      name: 'Single Core Message',
      description: 'Video should focus on one clear idea or takeaway',
      severity: 'error',
      category: 'structure',
      check: 'Does the video focus on ONE clear idea? Or does it try to cover too much?',
    },
    {
      id: 'th_payoff_timing',
      name: 'Payoff Delivered',
      description: 'The promised value must be delivered before viewer drop-off',
      severity: 'error',
      category: 'structure',
      check: 'If the hook makes a promise, is it fulfilled? When does the payoff happen?',
    },

    // CTA RULES
    {
      id: 'th_cta_presence',
      name: 'Clear Call-to-Action',
      description: 'Should end with clear next step or CTA',
      severity: 'info',
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
3. Clear description of what's wrong
4. Actionable suggestion to fix it
5. Confidence score (0.0-1.0)

Return VALID JSON ONLY in this format:
{
  "violations": [
    {
      "ruleId": "th_hook_timing",
      "ruleName": "Hook Within 3 Seconds",
      "severity": "error",
      "category": "hook",
      "message": "Hook appears at 0:05, which is too late",
      "timestamp": "0:05",
      "suggestion": "Move the core question to 0:00. Start with: 'Want to know why...'",
      "confidence": 0.95
    }
  ],
  "summary": "Brief 2-3 sentence summary of overall video quality and main issues"
}

Be specific. Reference actual moments in the video. Provide actionable feedback.`,
};
