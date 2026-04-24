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

	const charsList =
		spec.characters.length === 0
			? '(no characters — narration / product-only shots)'
			: spec.characters
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

	// Product demo branch: swap the framing and inject product context.
	if (spec.productContext) {
		const pc = spec.productContext;
		const subheadLine = pc.subhead ? `- Value prop: ${pc.subhead}` : '';
		const brief = pc.brief;
		const briefBlock = brief
			? `
DEMO BRIEF (distilled from the live product page — trust this over generic SaaS tropes):
${brief.oneLiner ? `- One-liner: ${brief.oneLiner}` : ''}
${brief.valueProps?.length ? `- Value props: ${brief.valueProps.map((v) => `"${v}"`).join(' · ')}` : ''}
${brief.features?.length ? `- Features worth highlighting:\n${brief.features.map((f) => `  - ${f.name}: ${f.benefit}`).join('\n')}` : ''}
${brief.inferredTone ? `- Product's own voice: ${brief.inferredTone}` : ''}
${brief.inferredAudience ? `- Audience: ${brief.inferredAudience}` : ''}
${brief.brandSignals ? `- Brand signals: ${brief.brandSignals}` : ''}
${brief.avoid?.length ? `- AVOID: ${brief.avoid.map((a) => `"${a}"`).join(' · ')}` : ''}
`
			: '';
		return `You are a product marketing writer for a short animated product demo. The user has supplied a real product (name, headline, optional subhead, CTA) and a visual style. Your job is to plan a 5-beat animated demo that ends with the CTA, using the product_demo arc.

PRODUCT:
- Name: ${pc.productName}
- Headline: ${pc.headline}
${subheadLine}
- CTA (final beat payoff): ${pc.ctaText}
${pc.sourceUrl ? `- Source URL (context only): ${pc.sourceUrl}` : ''}
${briefBlock}
STYLE:
- Tone: ${spec.tone}
- Visual style: ${spec.styleAnchor}
- Setting: ${spec.sceneAnchor}

CHARACTERS (${spec.characters.length}):
${charsList}

${arcDirection}
BEAT COUNT: ${beatCount}

NARRATIVE ROLES (product_demo arc):
- hook_problem: open on the pain or status-quo frustration the product solves. No branding yet.
- product_reveal: introduce the product by name. This beat pins the product screenshot as its visual reference — describe the screen honestly.
- feature_highlight: showcase ONE concrete feature or moment. Each feature_highlight beat should spotlight a DIFFERENT aspect. Pins the product screenshot again.
- cta: land the user's CTA text. Brand-forward, confident, action-oriented.

YOUR TASK — produce STRICT JSON with this shape:

{
  "characters": [
    {
      "id": "char_1",
      "sheetPrompt": "<one-paragraph visual description of the character (e.g. a narrator / mascot) in the user's visual style. Empty if no characters.>"
    }
  ],
  "beatIntents": [
    {
      "beatIndex": 1,
      "narrativeRole": "hook_problem",
      "intent": "<one-sentence declarative: what HAPPENS in this beat. Concrete, specific to THIS product. Not generic marketing speak.>"
    }
  ]
}

RULES:
- characters: ${spec.characters.length === 0 ? 'Return an empty array.' : 'One object per character in the same order. id matches. sheetPrompt must lock identity across beats (describe face, build, wardrobe, style, distinguishing features). Describe IN the user\'s visual style (' + spec.styleAnchor + ').'}
- beatIntents: exactly ${beatCount} entries. beatIndex is 1-based. narrativeRole MUST come from the ROLE SEQUENCE above.
- product_reveal and feature_highlight beats MUST reference the product by name and describe what the viewer sees ON the product (not abstract).
- feature_highlight beats should each cover a DISTINCT feature or benefit — no generic restating. If the DEMO BRIEF lists specific features, use those exactly; do not invent new ones.
- cta beat MUST deliver the exact CTA text "${pc.ctaText}" via action or dialogue.
- Tone (${spec.tone}) governs the emotional register.
- Do NOT invent new characters. Do NOT shift the product name. Do NOT make claims the product doesn't support.

RESPONSE FORMAT: Return ONLY the JSON object. No markdown fences, no preamble, no trailing commentary.${localeInstruction}`;
	}

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
