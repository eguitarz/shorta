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

	const charBlock =
		meta.characters.length === 0
			? '  (no characters — product / scene only)'
			: meta.characters
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

	const productBlock = meta.productContext
		? (() => {
				const pc = meta.productContext!;
				const brief = pc.brief;
				const lines: string[] = [
					'',
					'PRODUCT (pinned as reference image on reveal + feature beats):',
					`- Name: ${pc.productName}`,
					`- Headline: ${pc.headline}`,
				];
				if (pc.subhead) lines.push(`- Value prop: ${pc.subhead}`);
				lines.push(`- CTA: ${pc.ctaText}`);
				if (brief?.brandSignals) lines.push(`- Brand signals: ${brief.brandSignals}`);
				if (brief?.features?.length) {
					lines.push('- Features to showcase on feature_highlight beats (pick distinct ones per beat):');
					for (const f of brief.features) {
						lines.push(`  - ${f.name}: ${f.benefit}`);
					}
				}
				if (brief?.inferredTone) lines.push(`- Product voice: ${brief.inferredTone}`);
				if (brief?.avoid?.length) {
					lines.push(`- AVOID: ${brief.avoid.map((a) => `"${a}"`).join(' · ')}`);
				}
				lines.push('');
				return lines.join('\n');
			})()
		: '';

	const productRules = meta.productContext
		? `
PRODUCT DEMO RULES:
- The 'cta' beat MUST set productRefs: ["hero"]. This is the ONLY beat that references the product image by default — it pins the user's actual product as a Gemini reference so the final frame shows the real brand/label.
- The 'cta' beat MUST ALSO deliver the exact CTA text "${meta.productContext.ctaText}" in either dialogue, characterAction, or as an on-screen text overlay referenced in sceneSnippet.
- For 'product_reveal' and 'feature_highlight' beats, OMIT productRefs by default. These beats narrate the product's benefits and can imply the product through composition (hand reaching for a bottle, subject looking at the packaging, etc.) without pinning the product image as a reference. The user can opt a specific beat into product-referencing via the storyboard editor if they want it visible.
- DO NOT set useRefAsImage on any beat. All beats are AI-generated; product reference (when used) is pinned via productRefs and the two-pass editing step handles label fidelity.
- 'hook_problem' beats describe the pain or frustration the product solves, without showing the product yet (no productRefs).
- For reveal + feature + cta beats, the 'visual' bullet list MUST include a line like "Product screenshot displayed in-frame (reference image 'hero')" so the image renderer knows to preserve the literal UI.
- cameraAction on reveal/feature/cta beats should frame the product screen prominently (e.g., "Static medium shot, product fills 60% of frame", "Push-in on the product UI").
- sceneSnippet must describe what is VISIBLE on the product screen using the real product name "${meta.productContext.productName}" — don't invent UI that isn't there.
- Keep copy concise and confident. Product-demo voice, not whimsical story voice.
`
		: '';

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
${productBlock}
CHARACTERS (reference by id; sheetPrompt text MUST be injected into any beat they appear in):
${charBlock}

BEAT INTENTS (${beatIntents.length} beats):
${intentsBlock}
${productRules}
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
      "productRefs": ${meta.productContext ? '["hero"] on the cta beat ONLY by default. Omit on reveal/feature/hook beats — user opts them in manually if needed.' : 'omit (story mode)'},
      "characterAction": "<what the referenced characters DO in this beat, 1-2 sentences${meta.productContext && meta.characters.length === 0 ? '. If no characters, describe the UI action or product behavior instead' : ''}>",
      "cameraAction": "<shot framing + movement, plain English. e.g., 'Medium close-up, static'>",
      "sceneSnippet": "<scene-specific visual detail that builds on the setting. 1 sentence.>",
      "endFrameIntent": "<Still-frame description of the FINAL state of this beat, AFTER characterAction has completed and any cameraMovement has finished. Downstream video models (Veo 3, Runway Gen-4) interpolate between the start frame and this end frame — the more concrete and distinct the end state, the cleaner the motion. For static beats, describe a small delta (e.g. 'same composition; subject's hand has landed on the keyboard; expression shifted from curious to focused'). 1-2 sentences.>",
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

NARRATIVE CONSISTENCY (CRITICAL — this is what separates a real short from a pile of disconnected beats):
- The 'script' field across ALL ${beatIntents.length} beats forms ONE continuous voiceover read by the SAME narrator in a SINGLE breath. Read your own beats top-to-bottom: do they flow as one monologue, or feel like five strangers reading separate cue cards?
- Beat N's script MUST pick up where Beat N-1's left off — same voice, same tense (default present), same point-of-view, same name conventions. If Beat 1 calls the user "you", Beat 4 doesn't switch to "people" or "everyone".
- DO NOT re-introduce the product/topic/character in every beat. The narrator established context in Beat 1; subsequent beats build on it. No restating the headline or product name unless landing the CTA.
- Use connective beats — "But here's the thing", "That's why", "And then" — sparingly to bind beats together. One transition per arc max. Never start every beat with one.
- Total script across all beats should read aloud in roughly ${totalLengthSeconds}s. ~${Math.round((totalLengthSeconds * 2.5))} words total split across the beats by their relative duration. Don't overpack — silence is fine.
- TONE consistency: every beat's script must match meta.tone (${meta.tone}). If tone is "funny", every line carries the joke voice; if "confident", every line is declarative; etc. No tone-switching mid-arc.
- Final beat's script should LAND the ${meta.productContext ? `CTA "${meta.productContext.ctaText}"` : `payoff (${meta.payoff})`} as the last sentence the viewer hears.

EVERY beat MUST include ALL of these fields — no exceptions, no skipping, even if the information duplicates the animation-mode fields (characterAction, cameraAction, sceneSnippet). The downstream renderer requires them:
  - script (what's said/narrated in this beat)
  - visual (bullet list of what the camera shows)
  - audio (bullet list of music/SFX/ambience)
  - directorNotes (bullet list of shooting instructions)
  - endFrameIntent (still description of the post-action state — required for first+last frame video generation)
If you feel these overlap with characterAction/cameraAction/sceneSnippet, restate in bullet form. Do NOT omit.

RESPONSE FORMAT: Return ONLY the JSON object. No markdown fences, no preamble, no commentary.${localeInstruction}`;
}
