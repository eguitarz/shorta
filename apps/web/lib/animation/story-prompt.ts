/**
 * Pass 1 LLM prompt for the AI Animation Storyboard pipeline.
 *
 * Transforms a user-authored wizard spec (logline + tone + style + chars +
 * arc + payoff) into structured character descriptions and per-beat intents
 * that Pass 2 then expands into full beats.
 *
 * Pass 1 is narrative-focused: it decides what happens in each beat (intent)
 * and what each character LOOKS like (sheetPrompt). Pass 2 is shot-focused:
 * camera, action, scene detail, dialogue.
 *
 * Splitting the two keeps prompts tight and gives us two clean failure
 * surfaces instead of one giant request. Output is strict JSON.
 */

import { getLanguageName } from '@/lib/i18n-helpers';
import type { AnimationWizardSpec, NarrativeRole } from '@/lib/types/beat';
import { getArcTemplate, rolesForBeatCount } from './arc-templates';

/**
 * Derive the narrative-role sequence for this storyboard. Packs/stretches
 * the arc template's roles to match the chosen beat count. For `custom`
 * arcs, the caller must supply their own role sequence (we can't infer
 * roles from free-form text).
 */
export function resolveBeatRoles(spec: AnimationWizardSpec, beatCount: number): NarrativeRole[] {
	if (spec.arcTemplate === 'custom') {
		// Custom arc: default to a generic 5-role sequence and let the LLM
		// interpret arcCustomDescription. Not perfect, but fails-open.
		const fallback: NarrativeRole[] = ['setup', 'inciting', 'escalation', 'payoff', 'button'];
		return fallback.slice(0, beatCount).length === beatCount
			? fallback.slice(0, beatCount)
			: [...fallback, ...Array(Math.max(0, beatCount - fallback.length)).fill('escalation')].slice(0, beatCount) as NarrativeRole[];
	}
	const template = getArcTemplate(spec.arcTemplate);
	return rolesForBeatCount(template, beatCount);
}

/** Deterministic character id from index. Stable across Pass 1 / Pass 2 / UI. */
export function characterId(index: number): string {
	return `char_${index + 1}`;
}

export interface StoryPromptInput {
	spec: AnimationWizardSpec;
	beatCount: number;
	locale?: string;
}

export function buildStoryPrompt(input: StoryPromptInput): string {
	const { spec, beatCount, locale } = input;
	const roles = resolveBeatRoles(spec, beatCount);

	const charsList = spec.characters
		.map((c, i) => {
			const traits = c.traits.length ? c.traits.join(', ') : '(no appearance traits given)';
			return `${i + 1}. id="${characterId(i)}" name="${c.name}"
   traits: ${traits}
   personality: ${c.personality || '(not specified)'}`;
		})
		.join('\n');

	const arcDirection =
		spec.arcTemplate === 'custom' && spec.arcCustomDescription
			? `CUSTOM ARC (user's own description): ${spec.arcCustomDescription}`
			: `ARC TEMPLATE: ${spec.arcTemplate}
ROLE SEQUENCE (beatIndex → role): ${roles.map((r, i) => `${i + 1}→${r}`).join(', ')}`;

	const localeInstruction =
		locale && locale !== 'en'
			? `\nLANGUAGE: Write ALL user-facing text (intents, sheetPrompts) in ${getLanguageName(locale)}. Keep field keys in English.`
			: '';

	return `You are a story editor for short-form animated video. The user has supplied a premise, characters, an arc, and a payoff. Your job is to expand this into a structured plan that a downstream shot writer will turn into beats.

PREMISE:
- Logline: ${spec.logline}
- Tone: ${spec.tone}
- Visual style: ${spec.styleAnchor}
- Setting: ${spec.sceneAnchor}
- Payoff (the landing): ${spec.payoff}

CHARACTERS (${spec.characters.length}):
${charsList}

${arcDirection}
BEAT COUNT: ${beatCount}

YOUR TASK — produce STRICT JSON with this shape:

{
  "characters": [
    {
      "id": "char_1",
      "sheetPrompt": "<one-paragraph visual description suitable for generating a consistent character portrait. Must be specific about face structure, hair, build, clothing, distinguishing features, and art-style-appropriate rendering. This text will be re-used verbatim in every beat's image prompt to lock identity.>"
    }
  ],
  "beatIntents": [
    {
      "beatIndex": 1,
      "narrativeRole": "setup",
      "intent": "<one-sentence declarative: what HAPPENS in this beat. Not camera. Not dialogue. Just the plot beat, told plainly.>"
    }
  ]
}

RULES:
- characters: one object per input character, in the same order. id matches the input. sheetPrompt must be detailed enough that a downstream image model can render the character identically across multiple beats. Describe IN the user's chosen visual style (${spec.styleAnchor}).
- beatIntents: exactly ${beatCount} entries. beatIndex is 1-based. narrativeRole MUST come from the ROLE SEQUENCE above (not from your own taxonomy). intent is a single declarative sentence about what happens.
- The arc must LAND the user's payoff at whichever beat has role 'payoff'. The 'button' role (if present) is a tag/stinger after the payoff.
- Tone (${spec.tone}) governs the emotional register of every intent.
- Do NOT invent new characters. Do NOT change character names. Do NOT shift the setting.

RESPONSE FORMAT: Return ONLY the JSON object. No markdown fences, no preamble, no trailing commentary.${localeInstruction}`;
}
