import type { RuleSet } from '../types';

export const demoRules: RuleSet = {
  format: 'demo',
  rules: [
    // HOOK RULES
    {
      id: 'dm_hook_outcome_first',
      name: 'Show Outcome First',
      description: 'Demo videos must show the end result or "wow moment" within the first 3 seconds',
      severity: 'critical',
      category: 'hook',
      check: 'Does the video show the final result, outcome, or most impressive moment in the first 0-3 seconds? Demo videos that start with setup (opening apps, navigating menus) instead of the payoff lose viewers instantly.',
      goodExample: 'Start with the finished result: "Watch this AI generate a full website in 10 seconds" + show the result',
      badExample: 'Starting with: opening a browser, typing a URL, logging in, or navigating to a feature',
    },
    {
      id: 'dm_hook_text_overlay',
      name: 'Hook Text Overlay',
      description: 'Text overlay in first 3 seconds explaining what the viewer will see',
      severity: 'moderate',
      category: 'hook',
      check: 'Is there text overlay in the first 0-3 seconds that tells the viewer what they are about to see? Screen recordings are hard to parse without context.',
      goodExample: 'Bold text: "This AI tool writes code for you" over the screen recording',
      badExample: 'Raw screen recording with no text context — viewer doesn\'t know what to look at',
    },
    {
      id: 'dm_hook_clear_promise',
      name: 'Clear Value Promise',
      description: 'Viewer should know what they will learn or see within first 2 seconds',
      severity: 'moderate',
      category: 'hook',
      check: 'Within the first 2 seconds, does the viewer understand what they will learn, see, or gain from watching? Is there a clear promise via text, voiceover, or visual?',
    },

    // VISUAL RULES
    {
      id: 'dm_screen_readability',
      name: 'Screen Content Readable',
      description: 'Text, UI elements, and code on screen must be clearly readable',
      severity: 'critical',
      category: 'visual',
      check: 'Is the screen content (text, code, UI) clearly readable? Is the font size large enough? Is the resolution sufficient? Small text on a phone screen is a major issue for demo videos.',
      goodExample: 'Zoomed-in view of the relevant UI area, large font size, high contrast',
      badExample: 'Full desktop screenshot at 1080p where text is tiny and unreadable on mobile',
    },
    {
      id: 'dm_zoom_focus',
      name: 'Strategic Zoom and Focus',
      description: 'Should zoom into relevant areas rather than showing full screen',
      severity: 'moderate',
      category: 'visual',
      check: 'Does the video zoom into or highlight the relevant area of the screen when showing important actions? Full-screen recordings without zoom make it hard to follow on mobile.',
      goodExample: 'Zoom into the specific button, code section, or UI element being discussed',
      badExample: 'Full desktop view where the action happens in a small area of the screen',
    },
    {
      id: 'dm_cursor_highlight',
      name: 'Cursor/Action Visibility',
      description: 'Cursor or highlighted area should guide viewer attention',
      severity: 'minor',
      category: 'visual',
      check: 'Is the cursor clearly visible? Are click actions highlighted or annotated? Can the viewer easily follow where the action is happening on screen?',
    },

    // AUDIO RULES
    {
      id: 'dm_voiceover_clarity',
      name: 'Clear Voiceover',
      description: 'Voiceover or narration should be clear and well-paced',
      severity: 'critical',
      category: 'audio',
      check: 'If there is voiceover, is it clear and easy to understand? Is the audio quality good? For demos without voiceover, is there background music or sound design that maintains engagement?',
    },
    {
      id: 'dm_audio_action_sync',
      name: 'Audio Synced to Actions',
      description: 'Voiceover or sound effects should sync with on-screen actions',
      severity: 'moderate',
      category: 'audio',
      check: 'Does the voiceover explain what is happening on screen as it happens? Are sound effects or music beats synced with key moments (clicks, transitions, reveals)?',
    },

    // PACING RULES
    {
      id: 'dm_dead_time',
      name: 'No Dead Time',
      description: 'Loading screens, slow typing, and idle moments must be cut or sped up',
      severity: 'critical',
      category: 'pacing',
      check: 'Are there any dead moments? Loading screens, slow page loads, long typing sequences, idle navigation, or waiting for responses should be cut or shown in fast-forward. Dead time in demo videos is a top retention killer.',
      goodExample: 'Speed up typing sequences 4x, cut loading screens, jump-cut between steps',
      badExample: 'Watching a page load for 3 seconds, real-time typing, waiting for AI to generate',
    },
    {
      id: 'dm_step_pacing',
      name: 'Fast Step Transitions',
      description: 'Transitions between steps should be quick with no unnecessary pauses',
      severity: 'moderate',
      category: 'pacing',
      check: 'Are transitions between demo steps fast? No lingering on completed steps? Each step should flow into the next without dead air or unnecessary pauses.',
    },

    // STRUCTURE RULES
    {
      id: 'dm_setup_too_long',
      name: 'Setup Too Long',
      description: 'Context or setup should not exceed 20% of total video for demos',
      severity: 'critical',
      category: 'structure',
      check: 'Does the setup/context take more than 20% of the video before the actual demo begins? Demo viewers want to see the action fast. Setup should be minimal — ideally the outcome is shown first, then the how-to.',
      goodExample: 'Show result in first 3s, then "Here\'s how:" and jump into the demo',
      badExample: 'Spending 15+ seconds explaining why the tool exists before showing it',
    },
    {
      id: 'dm_one_workflow',
      name: 'Single Clear Workflow',
      description: 'Demo should show ONE clear workflow or feature, not multiple unrelated things',
      severity: 'critical',
      category: 'structure',
      check: 'Does the demo focus on ONE clear workflow, feature, or use case? Or does it jump between multiple unrelated features? Short-form demos must be focused.',
    },
    {
      id: 'dm_payoff_delivered',
      name: 'Demo Payoff Delivered',
      description: 'The promised result should be clearly shown',
      severity: 'critical',
      category: 'structure',
      check: 'Does the video clearly show the promised result or outcome? Is there a satisfying "reveal" moment where the demo delivers what was promised in the hook? Only flag if NO result is shown.',
      goodExample: 'Show the final output: generated code running, designed page live, tool producing the result',
      badExample: 'Video ends mid-demo without showing the final result or cutting off before the payoff',
    },

    // RETENTION RULES
    {
      id: 'dm_annotations',
      name: 'On-Screen Annotations',
      description: 'Text overlays, arrows, or highlights should guide the viewer through the demo',
      severity: 'moderate',
      category: 'retention',
      check: 'Are there helpful annotations (text overlays, arrows, circles, highlights) that guide the viewer through the demo? Raw screen recordings without annotations are harder to follow.',
    },
    {
      id: 'dm_duration',
      name: 'Optimal Duration',
      description: 'Demo shorts should be 15-120 seconds for optimal retention',
      severity: 'minor',
      category: 'structure',
      check: 'Is the video length appropriate for a demo? 15-120 seconds is ideal for short-form demos. Longer demos lose retention unless extremely engaging.',
    },

    // CTA RULES
    {
      id: 'dm_cta_try_it',
      name: 'Try-It CTA',
      description: 'Should end with a clear way for viewers to try the tool/product',
      severity: 'minor',
      category: 'cta',
      check: 'Does the video end with a clear way for viewers to try the product/tool themselves? A link mention, "link in bio", or "comment for access" type CTA?',
    },
  ],

  promptTemplate: `You are a VIDEO LINTER for DEMO/SCREEN RECORDING format short-form content.

This includes: software demos, product walkthroughs, tool tutorials, screen recordings, app showcases, and any video where the PRIMARY visual is a screen, UI, or product being demonstrated.

Analyze the video against these specific rules. For EACH rule, determine if it PASSES or FAILS.

RULES TO CHECK:
{{RULES_LIST}}

DEMO-SPECIFIC CONTEXT:
- Demo videos are judged differently from talking head or gameplay content
- The #1 retention killer in demos is DEAD TIME (loading, typing, navigating)
- Screen readability on MOBILE is critical — most viewers watch on phones
- Showing the outcome/result FIRST is the most effective hook pattern for demos
- Annotations and zoom-ins are essential because raw screen recordings are hard to follow
- Voiceover should explain the "why" while the screen shows the "what"

For each violation found, provide:
1. Rule ID that was violated
2. Specific timestamp where issue occurs (if applicable)
3. What's wrong - be specific and reference actual content
4. How to fix it - use this format:
   - Start with action verb (Cut, Replace, Add, Move, Show, Speed up, Zoom into)
   - State exactly what to change
   - Give specific example if applicable
   - Keep under 15 words when possible
   - NO vague words: avoid "consider", "maybe", "try to", "could"
5. Confidence score (0.0-1.0)

SUGGESTION EXAMPLES (Good):
✓ "Show the final result at 0:00 before the walkthrough"
✓ "Speed up the typing at 0:12-0:18 to 4x"
✓ "Cut the loading screen at 0:08-0:11"
✓ "Zoom into the settings panel at 0:15 — unreadable on mobile"
✓ "Add text overlay at 0:00: 'This AI builds websites in 10s'"

SUGGESTION EXAMPLES (Bad):
✗ "Consider making the screen more readable" (too vague)
✗ "You might want to speed things up" (not specific)
✗ "Try adding some annotations" (not actionable)

Return VALID JSON ONLY in this format:
{
  "violations": [
    {
      "ruleId": "dm_hook_outcome_first",
      "ruleName": "Show Outcome First",
      "severity": "critical",
      "category": "hook",
      "message": "Video starts with opening a browser and navigating to the tool — no outcome shown in first 3 seconds",
      "timestamp": "0:00-0:05",
      "suggestion": "Move the final result from 0:45 to 0:00. Show the generated website first, then 'Here\\'s how:'",
      "confidence": 0.95
    }
  ],
  "summary": "Brief 2-3 sentence summary of overall video quality and main issues"
}

Be direct. Use imperative verbs. Give specific examples. Reference actual screen content.`,
};
