/**
 * On-demand export prompt rendering for AI Animation Storyboard beats.
 *
 * Per Codex T1 (eng review cross-model tension): we do NOT store rendered
 * prompts on beats. Instead we store structured fields (characterRefs,
 * characterAction, cameraAction, sceneSnippet, dialogue, styleAnchor,
 * sceneAnchor, character sheetPrompts) and render the copy-paste prompt
 * at click time. Prompt-template improvements propagate instantly; no
 * migration needed.
 *
 * v1 ships ONE universal format: [Camera] + [Subject] + [Action] + [Context] +
 * [Style]. This structure is what Veo / Sora / Runway / Kling all consume
 * productively with minor stylistic variance. Per-vendor variants are a
 * deferred TODO (see TODOS.md).
 */

import type { AnimationBeat, AnimationMeta } from '@/lib/types/beat';

export type ExportPlatform = 'universal' | 'flow';

export interface RenderExportInput {
	meta: AnimationMeta;
	beat: AnimationBeat;
	platform?: ExportPlatform;
}

/**
 * Render a copy-paste prompt for pasting into an external AI video tool.
 * Produces clean text — no markdown, no backticks, no smart quotes.
 *
 * Variants:
 *   universal — generic [Camera] + [Subject] + [Action] + [Scene] + [Style]
 *               format. Works in any tool; characters described inline.
 *   flow      — Google Flow / Veo 3.1 "Ingredients" syntax. Expects the user
 *               to have uploaded the character sheet as ingredient #1 named
 *               `@{character_id}`. Prompt references characters by @mention.
 */
export function renderExportPrompt(input: RenderExportInput): string {
	const { meta, beat } = input;
	const platform = input.platform ?? 'universal';

	if (platform === 'flow') return renderFlow(meta, beat);
	return renderUniversal(meta, beat);
}

function renderUniversal(meta: AnimationMeta, beat: AnimationBeat): string {
	const segments: string[] = [];

	// [Camera]
	const camera = beat.cameraAction?.trim() || joinCamera(beat.shotType, beat.cameraMovement);
	if (camera) {
		segments.push(`Camera: ${sanitize(camera)}.`);
	}

	// [Subject] — characters by reference, with their locked sheetPrompt descriptions
	const subject = renderSubject(meta, beat);
	if (subject) {
		segments.push(`Subject: ${subject}`);
	}

	// [Action]
	const action = beat.characterAction?.trim();
	if (action) {
		segments.push(`Action: ${sanitize(action)}`);
	} else if (beat.script?.trim()) {
		// Fallback: if Pass 2 didn't produce characterAction, use script.
		segments.push(`Action: ${sanitize(beat.script.trim())}`);
	}

	// [Context] — setting anchor + beat-specific scene snippet
	const context = renderContext(meta, beat);
	if (context) {
		segments.push(`Scene: ${context}`);
	}

	// Dialogue (if any)
	if (beat.dialogue?.trim()) {
		segments.push(`Dialogue: "${sanitize(beat.dialogue.trim())}"`);
	}

	// [Style] — style anchor last, acts as the tail modifier every tool respects
	if (meta.styleAnchor?.trim()) {
		segments.push(`Style: ${sanitize(meta.styleAnchor.trim())}.`);
	}

	return segments.join('\n');
}

function joinCamera(shotType?: string, cameraMovement?: string): string {
	const parts: string[] = [];
	if (shotType) parts.push(shotType);
	if (cameraMovement && cameraMovement !== 'static') parts.push(cameraMovement);
	else if (cameraMovement === 'static') parts.push('static');
	return parts.join(', ');
}

function renderSubject(meta: AnimationMeta, beat: AnimationBeat): string {
	const refs = beat.characterRefs ?? [];
	if (refs.length === 0) return '';

	const pieces: string[] = [];
	for (const ref of refs) {
		const char = meta.characters.find((c) => c.id === ref);
		if (!char) continue;
		if (char.sheetPrompt?.trim()) {
			// Inject full sheetPrompt — this is the character-identity payload.
			pieces.push(`${char.name} (${sanitize(char.sheetPrompt.trim())})`);
		} else {
			// Fallback to traits + personality if sheetPrompt wasn't produced.
			const traits = char.traits?.join(', ') || 'no appearance notes';
			pieces.push(`${char.name} (${traits}; ${char.personality || 'no personality notes'})`);
		}
	}
	return pieces.join('; ');
}

/**
 * Google Flow / Veo 3.1 variant. Uses @mention syntax for characters — the
 * user must upload each character sheet as a Flow "ingredient" first, named
 * `{character_id}`. The render emits exactly what Flow's ingredients-to-video
 * flow expects: a plain-English prompt with @mentions for recurring subjects.
 */
function renderFlow(meta: AnimationMeta, beat: AnimationBeat): string {
	const segments: string[] = [];

	// [Camera] — Flow is cinematic-first; lead with camera.
	const camera = beat.cameraAction?.trim() || joinCamera(beat.shotType, beat.cameraMovement);
	if (camera) segments.push(`${sanitize(camera)}.`);

	// [Subject + Action] combined — Flow prefers a single narrative sentence
	// with @mentions for ingredients rather than separate labeled fields.
	const subjectAction = renderFlowSubjectAction(meta, beat);
	if (subjectAction) segments.push(subjectAction);

	// [Scene]
	const context = renderContext(meta, beat);
	if (context) segments.push(sanitize(context));

	// Dialogue
	if (beat.dialogue?.trim()) {
		segments.push(`Dialogue: "${sanitize(beat.dialogue.trim())}"`);
	}

	// [Style] as tail modifier.
	if (meta.styleAnchor?.trim()) {
		segments.push(`Style: ${sanitize(meta.styleAnchor.trim())}.`);
	}

	return segments.join(' ');
}

function renderFlowSubjectAction(meta: AnimationMeta, beat: AnimationBeat): string {
	const refs = beat.characterRefs ?? [];
	const action = beat.characterAction?.trim() || beat.script?.trim() || '';

	if (refs.length === 0) {
		return action ? sanitize(action) : '';
	}

	// Build a "@char_1 and @char_2" subject clause. Flow treats @mentions as
	// ingredient lookups — the user must upload each character sheet as an
	// ingredient with the matching name before generating.
	const mentions: string[] = [];
	for (const ref of refs) {
		const char = meta.characters.find((c) => c.id === ref);
		if (!char) continue;
		// Use ingredient mention followed by human name for readability.
		mentions.push(`@${char.id}`);
	}
	if (mentions.length === 0) return action ? sanitize(action) : '';

	const subjectClause =
		mentions.length === 1
			? `Using ${mentions[0]},`
			: `Using ${mentions.slice(0, -1).join(', ')} and ${mentions[mentions.length - 1]},`;

	return action ? `${subjectClause} ${sanitize(action)}` : subjectClause;
}

function renderContext(meta: AnimationMeta, beat: AnimationBeat): string {
	const parts: string[] = [];
	if (meta.sceneAnchor?.trim()) parts.push(sanitize(meta.sceneAnchor.trim()));
	if (beat.sceneSnippet?.trim()) parts.push(sanitize(beat.sceneSnippet.trim()));
	return parts.join('. ');
}

/**
 * Replace smart quotes, backticks, triple backticks, and trailing whitespace
 * that would leak when copy-pasted into external video tools. We want plain
 * text the user can paste without surprises.
 */
function sanitize(s: string): string {
	return s
		.replace(/[\u201C\u201D]/g, '"') // " "
		.replace(/[\u2018\u2019]/g, "'") // ' '
		.replace(/`+/g, '') // strip backticks / code fences
		.replace(/\s+$/g, '') // trim trailing whitespace
		.replace(/\n{3,}/g, '\n\n'); // collapse excessive blank lines
}
