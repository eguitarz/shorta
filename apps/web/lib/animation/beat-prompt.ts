/**
 * Pass 2 LLM prompt for the AI Animation Storyboard pipeline.
 *
 * Consumes:
 *   - AnimationMeta (populated from Pass 1: characters with sheetPrompts,
 *     styleAnchor, sceneAnchor, arcTemplate, payoff, tone, logline)
 *   - beatIntents (from Pass 1 output: per-beat narrativeRole + intent)
 *   - totalLength (seconds)
 *
 * Produces a full beats[] array with shot-level detail (characterAction,
 * cameraAction, sceneSnippet, dialogue) plus the standard Beat fields
 * (startTime, endTime, script, visual, audio, etc.) that downstream code
 * already expects.
 *
 * Character sheet text is injected VERBATIM into the prompt. The beat-image
 * stage will inject the sheet IMAGE as referenceImage; both together lock
 * character identity across beats.
 */

import { getLanguageName } from '@/lib/i18n-helpers';
import type { AnimationBeatIntent, AnimationMeta } from '@/lib/types/beat';

// Re-export so existing callers that imported BeatIntent from this module
// keep working. The canonical definition lives in lib/types/beat.ts.
export type BeatIntent = AnimationBeatIntent;

export interface BeatsPromptInput {
	meta: AnimationMeta;
	beatIntents: AnimationBeatIntent[];
	totalLengthSeconds: number;
	locale?: string;
}

/** Compute beat time boundaries by even division, rounding to 1 decimal. */
export function computeBeatTimings(
	beatCount: number,
	totalLengthSeconds: number
): Array<{ beatIndex: number; startTime: number; endTime: number }> {
	if (beatCount <= 0) throw new Error('computeBeatTimings: beatCount must be >= 1');
	if (totalLengthSeconds <= 0) throw new Error('computeBeatTimings: totalLengthSeconds must be > 0');

	const per = totalLengthSeconds / beatCount;
	const out: Array<{ beatIndex: number; startTime: number; endTime: number }> = [];
	for (let i = 0; i < beatCount; i++) {
		const start = Math.round(i * per * 10) / 10;
		const end = i === beatCount - 1 ? totalLengthSeconds : Math.round((i + 1) * per * 10) / 10;
		out.push({ beatIndex: i + 1, startTime: start, endTime: end });
	}
	return out;
}

export function buildBeatsPrompt(input: BeatsPromptInput): string {
	const { meta, beatIntents, totalLengthSeconds, locale } = input;

	if (beatIntents.length === 0) {
		throw new Error('buildBeatsPrompt: beatIntents is empty');
	}

	const timings = computeBeatTimings(beatIntents.length, totalLengthSeconds);

	const charBlock = meta.characters
		.map((c) => {
			const sheet = c.sheetPrompt?.trim() || '(no sheet description — Pass 1 did not populate this character)';
			return `  - id="${c.id}" name="${c.name}"
    traits: ${c.traits.join(', ') || '(none)'}
    personality: ${c.personality || '(unspecified)'}
    sheetPrompt (inject verbatim wherever you reference this character):
      ${sheet.split('\n').join('\n      ')}`;
		})
		.join('\n');

	const intentsBlock = beatIntents
		.map((bi) => {
			const t = timings[bi.beatIndex - 1];
			return `  Beat ${bi.beatIndex} [${bi.narrativeRole}] (${t.startTime}s–${t.endTime}s): ${bi.intent}`;
		})
		.join('\n');

	const arcHint =
		meta.arcTemplate === 'custom' && meta.arcCustomDescription
			? `CUSTOM ARC: ${meta.arcCustomDescription}`
			: `ARC: ${meta.arcTemplate}`;

	const localeInstruction =
		locale && locale !== 'en'
			? `\nLANGUAGE: Write ALL user-facing text (title, script, visual, audio, characterAction, cameraAction, sceneSnippet, dialogue, directorNotes) in ${getLanguageName(locale)}. Keep JSON keys in English.`
			: '';

	return `You are a shot writer for short-form animated video. The story and characters are already set. Your job is to turn each beat intent into a concrete shot specification that an AI video generator (Veo / Sora / Runway / Kling) can execute.

STORY CONTEXT (do not change):
- Logline: ${meta.logline}
- Tone: ${meta.tone}
- Visual style: ${meta.styleAnchor}
- Setting: ${meta.sceneAnchor}
- Payoff: ${meta.payoff}
- ${arcHint}
- Total length: ${totalLengthSeconds}s

CHARACTERS (reference by id; sheetPrompt text MUST be injected into any beat they appear in):
${charBlock}

BEAT INTENTS (${beatIntents.length} beats):
${intentsBlock}

YOUR TASK — produce STRICT JSON with this shape:

{
  "beats": [
    {
      "beatNumber": 1,
      "startTime": 0,
      "endTime": <from timings above>,
      "type": "<one of: hook, setup, main_content, payoff, cta — pick the closest match to narrativeRole>",
      "narrativeRole": "<echo the narrativeRole from the intent>",
      "title": "<5-10 word title for this beat>",
      "characterRefs": ["char_1", ...],
      "characterAction": "<what the referenced characters DO in this beat, 1-2 sentences>",
      "cameraAction": "<shot framing + movement, plain English. e.g., 'Medium close-up, static'>",
      "sceneSnippet": "<scene-specific visual detail that builds on the setting. 1 sentence.>",
      "dialogue": "<optional. Omit this field if no character speaks.>",
      "script": "<narration or voice-over text for this beat, or repeat dialogue if the beat is dialogue-only>",
      "visual": "<bullet list, 2-3 lines, each under 10 words. Describe what the camera sees.>",
      "audio": "<bullet list, 1-2 lines, each under 8 words. Music / SFX / ambience.>",
      "directorNotes": "<bullet list, 3-5 points. Action verbs (Start, Show, Cut, Maintain). Wrap the 1-2 most critical in **double asterisks**.>",
      "shotType": "<one of: CU, MCU, MS, MLS, WS, OTS, POV, INSERT>",
      "cameraMovement": "<one of: static, pan, tilt, track, zoom, handheld, dolly>",
      "transition": "<one of: cut, dissolve, fade, zoom, swipe, whip, none>"
    }
  ]
}

RULES:
- Exactly ${beatIntents.length} beats. Match beatNumber + startTime + endTime to the BEAT INTENTS timings above.
- characterRefs only uses ids that exist in the CHARACTERS list. If a beat has no characters visible (rare), use an empty array and explain in sceneSnippet.
- characterAction must be specific enough that the external video generator knows what the character is doing. Avoid "the character reacts" — say what reaction.
- cameraAction combines shotType + cameraMovement into a plain-English phrase. e.g. "Medium close-up, slow dolly in." This is the field copy-prompts use.
- sceneSnippet MUST be consistent with the setting (${meta.sceneAnchor}). No location jumps unless the logline or arc explicitly demands one.
- dialogue: include ONLY when a character actually speaks. Omit the field otherwise.
- Style identity: every beat where a character appears must feel like the SAME ${meta.styleAnchor} world. Do not drift between styles across beats.
- LAND the payoff: the beat with narrativeRole 'payoff' must deliver the user's payoff line (${meta.payoff}) in either characterAction, dialogue, or sceneSnippet.

RESPONSE FORMAT: Return ONLY the JSON object. No markdown fences, no preamble, no commentary.${localeInstruction}`;
}
