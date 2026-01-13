import type { RuleSet } from '../types';

export const gameplayRules: RuleSet = {
  format: 'gameplay',
  rules: [
    // HOOK RULES
    {
      id: 'gp_hook_action',
      name: 'Immediate Action',
      description: 'Hook should show exciting gameplay moment within first 2 seconds',
      severity: 'critical',
      category: 'hook',
      check: 'Does the video start with immediate action or an exciting gameplay moment in 0-2s?',
    },
    {
      id: 'gp_hook_text_overlay',
      name: 'Hook Text Overlay',
      description: 'Text overlay in first 3 seconds increases retention',
      severity: 'moderate',
      category: 'hook',
      check: 'Is there text overlay in the first 0-3 seconds explaining what will happen?',
    },

    // VISUAL RULES
    {
      id: 'gp_gameplay_clarity',
      name: 'Clear Gameplay Visibility',
      description: 'Game UI and action should be clearly visible',
      severity: 'critical',
      category: 'visual',
      check: 'Is the gameplay clear and easy to see? UI elements readable?',
    },
    {
      id: 'gp_facecam_size',
      name: 'Facecam Not Blocking Action',
      description: 'If facecam present, it should not block critical gameplay',
      severity: 'moderate',
      category: 'visual',
      check: 'If there is a facecam, does it block important game UI or action?',
    },
    {
      id: 'gp_visual_quality',
      name: 'High Visual Quality',
      description: 'Gameplay footage should be high quality (1080p+, smooth)',
      severity: 'moderate',
      category: 'visual',
      check: 'Is the gameplay footage high quality? Smooth framerate? Good resolution?',
    },

    // AUDIO RULES
    {
      id: 'gp_audio_mix',
      name: 'Balanced Audio Mix',
      description: 'Game audio and commentary should be balanced',
      severity: 'critical',
      category: 'audio',
      check: 'Is the audio mix balanced? Can you hear both commentary and game sounds clearly?',
    },
    {
      id: 'gp_commentary_energy',
      name: 'Energetic Commentary',
      description: 'Commentary should match the intensity of gameplay',
      severity: 'moderate',
      category: 'audio',
      check: 'Does the commentary energy match the gameplay intensity?',
    },

    // RETENTION RULES
    {
      id: 'gp_highlight_moment',
      name: 'Clear Highlight Moment',
      description: 'Video should build to or feature a clear highlight moment',
      severity: 'critical',
      category: 'retention',
      check: 'Is there a clear highlight or climax moment? When does it occur?',
    },
    {
      id: 'gp_pacing',
      name: 'Fast Pacing',
      description: 'Gameplay should be edited for fast pacing, no dead moments',
      severity: 'moderate',
      category: 'pacing',
      check: 'Is the pacing fast? Any slow moments or dead air that should be cut?',
    },
    {
      id: 'gp_music_sync',
      name: 'Music Synced to Action',
      description: 'Background music should sync with key gameplay moments',
      severity: 'minor',
      category: 'retention',
      check: 'If background music is present, does it sync with the action?',
    },

    // STRUCTURE RULES
    {
      id: 'gp_context_quick',
      name: 'Quick Context Setup',
      description: 'Context should be established in first 5 seconds',
      severity: 'moderate',
      category: 'structure',
      check: 'Is the context/setup established quickly (within 5s)? What game? What is happening?',
    },
    {
      id: 'gp_payoff_clear',
      name: 'Clear Payoff',
      description: 'The promised moment or outcome should be shown',
      severity: 'critical',
      category: 'structure',
      check: 'Does the video truly deliver on the hook promise? Is there ANY payoff shown at all? This is CRITICAL - only flag if NO payoff is delivered. If payoff is shown but clarity/impact comes later, this is less severe.',
    },
    {
      id: 'gp_duration',
      name: 'Optimal Duration',
      description: 'Gameplay shorts should be 10-30 seconds for peak retention',
      severity: 'minor',
      category: 'structure',
      check: 'Is the video length optimal (10-30s for most gameplay)?',
    },
  ],

  promptTemplate: `You are a VIDEO LINTER for GAMEPLAY format short-form content.

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
      "ruleId": "gp_hook_action",
      "ruleName": "Immediate Action",
      "severity": "error",
      "category": "hook",
      "message": "Video starts with a menu screen for 4 seconds before action",
      "timestamp": "0:00-0:04",
      "suggestion": "Cut the menu screen. Start immediately with the kill/play moment at 0:04",
      "confidence": 0.98
    }
  ],
  "summary": "Brief 2-3 sentence summary of overall video quality and main issues"
}

Be specific. Reference actual moments in the video. Provide actionable feedback.`,
};
