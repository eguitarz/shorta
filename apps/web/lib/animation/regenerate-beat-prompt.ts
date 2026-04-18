/**
 * Regeneration prompt for a single animation beat.
 *
 * Preserves the locked narrative structure (arcTemplate, payoff, narrativeRole
 * on THIS beat) and injects the character sheet descriptions so identity
 * holds across regenerations. Users can re-roll individual beats without the
 * story drifting — that's the v1 contract (see TODOS.md: "Beat regeneration
 * scope rules for animation mode").
 *
 * Output shape matches what parsePass2Output expects minus the timing fields,
 * which the route preserves from the original beat.
 */

import { getLanguageName } from '@/lib/i18n-helpers';
import type { AnimationBeat, AnimationMeta } from '@/lib/types/beat';

export interface AnimationStoryboardForRegen {
	overview: {
		title: string;
		contentType: string;
		nicheCategory: string;
		targetAudience: string;
		length: number;
	};
	beats: AnimationBeat[];
	animation_meta: AnimationMeta;
}

export function createAnimationRegenerationPrompt(
	storyboard: AnimationStoryboardForRegen,
	beat: AnimationBeat,
	locale?: string
): string {
	const { animation_meta: meta } = storyboard;
	const prev = storyboard.beats.find((b) => b.beatNumber === beat.beatNumber - 1);
	const next = storyboard.beats.find((b) => b.beatNumber === beat.beatNumber + 1);
	const duration = beat.endTime - beat.startTime;

	// Only inject characters that actually appear in THIS beat. Keeps the
	// prompt tight and prevents the LLM from inventing cameos.
	const relevantChars = meta.characters.filter((c) =>
		(beat.characterRefs ?? []).includes(c.id)
	);
	const charBlock = relevantChars
		.map((c) => {
			const sheet = c.sheetPrompt?.trim() || '(no sheet description)';
			return `  - ${c.name} (id=${c.id}): ${sheet}`;
		})
		.join('\n');

	const localeInstruction =
		locale && locale !== 'en'
			? `\nLANGUAGE: Write ALL user-facing text in ${getLanguageName(locale)}. Keep JSON keys in English.`
			: '';

	return `You are a shot writer regenerating ONE beat of an animated short. The story's arc, characters, and payoff are LOCKED. Only the shot-level details of this beat should change.

STORY CONTEXT (do not change):
- Logline: ${meta.logline}
- Tone: ${meta.tone}
- Visual style: ${meta.styleAnchor}
- Setting: ${meta.sceneAnchor}
- Payoff (locked): ${meta.payoff}

CHARACTERS IN THIS BEAT:
${charBlock || '(none — this beat has no characters visible)'}

BEAT TO REGENERATE (narrativeRole is LOCKED):
- Beat ${beat.beatNumber} [${beat.narrativeRole ?? 'unknown'}] (${beat.startTime}s–${beat.endTime}s, ${duration}s duration)
- Current title: ${beat.title}
- Current characterAction: ${beat.characterAction ?? '(empty)'}
- Current cameraAction: ${beat.cameraAction ?? '(empty)'}
- Current sceneSnippet: ${beat.sceneSnippet ?? '(empty)'}

${
	prev
		? `PREVIOUS BEAT (Beat ${prev.beatNumber} [${prev.narrativeRole ?? 'unknown'}]):
- characterAction: ${prev.characterAction ?? prev.script}
- Ends with transition: ${prev.transition ?? 'cut'}`
		: 'This is the FIRST beat.'
}

${
	next
		? `NEXT BEAT (Beat ${next.beatNumber} [${next.narrativeRole ?? 'unknown'}]):
- characterAction: ${next.characterAction ?? next.script}`
		: 'This is the LAST beat.'
}

RULES:
1. Produce a FRESH version: different camera angle, different character action, different scene detail.
2. narrativeRole MUST remain "${beat.narrativeRole ?? 'unknown'}". If this is the payoff beat, the user's locked payoff (${meta.payoff}) must still land here.
3. characterRefs MUST stay ${JSON.stringify(beat.characterRefs ?? [])} — do not add or remove characters.
4. Every referenced character must look IDENTICAL to their sheet description above. No appearance drift.
5. sceneSnippet must be consistent with the locked setting (${meta.sceneAnchor}).
6. Visual style MUST stay "${meta.styleAnchor}" — no style drift.

Return ONLY valid JSON (no markdown):
{
  "type": "${beat.type}",
  "narrativeRole": "${beat.narrativeRole ?? 'unknown'}",
  "title": "<fresh title>",
  "characterRefs": ${JSON.stringify(beat.characterRefs ?? [])},
  "characterAction": "<what the characters do, 1-2 sentences>",
  "cameraAction": "<framing + movement, plain English>",
  "sceneSnippet": "<scene-specific visual detail consistent with the setting>",
  "dialogue": "<optional; omit if no one speaks>",
  "script": "<narration or dialogue to voice over this beat>",
  "visual": "<bullet list, 2-3 lines, each under 10 words>",
  "audio": "<bullet list, 1-2 lines, each under 8 words>",
  "directorNotes": "<bullet list, 3-5 points, action verbs, wrap critical ones in **asterisks**>",
  "shotType": "<one of: CU, MCU, MS, MLS, WS, OTS, POV, INSERT>",
  "cameraMovement": "<one of: static, pan, tilt, track, zoom, handheld, dolly>",
  "transition": "<one of: cut, dissolve, fade, zoom, swipe, whip, none>"
}

Do NOT return any extra fields. Do NOT include markdown fences.${localeInstruction}`;
}
