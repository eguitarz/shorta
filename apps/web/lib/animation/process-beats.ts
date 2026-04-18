/**
 * Pass 2 orchestration: call the beats LLM with the post-Pass-1 animation_meta
 * (plus beat intents), parse the result, and persist beats on the storyboard.
 *
 * This is the moment the user can VIEW and EXPORT their storyboard per Codex
 * T3 ("text delivers first, images are enhancement"). status='beats_complete'
 * after this runs; the UI should auto-route to the output page at this point.
 *
 * Hard-fails on parse/LLM error. The text storyboard is the core value; a
 * failed Pass 2 means we can't deliver.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { buildBeatsPrompt } from './beat-prompt';
import type {
	AnimationBeat,
	AnimationBeatIntent,
	AnimationMeta,
	NarrativeRole,
	ShotType,
	CameraMovement,
	TransitionType,
} from '@/lib/types/beat';

export interface ProcessBeatsInput {
	supabase: SupabaseClient;
	env: LLMEnv;
	jobId: string;
	storyboardId: string;
	meta: AnimationMeta;
	totalLengthSeconds: number;
	locale?: string;
}

export interface ProcessBeatsResult {
	beats: AnimationBeat[];
}

const VALID_NARRATIVE_ROLES: readonly NarrativeRole[] = [
	'setup',
	'inciting',
	'escalation',
	'twist',
	'payoff',
	'button',
];

const VALID_SHOT_TYPES: readonly ShotType[] = [
	'CU',
	'MCU',
	'MS',
	'MLS',
	'WS',
	'OTS',
	'POV',
	'INSERT',
];

const VALID_CAMERA_MOVEMENTS: readonly CameraMovement[] = [
	'static',
	'pan',
	'tilt',
	'track',
	'zoom',
	'handheld',
	'dolly',
];

const VALID_TRANSITIONS: readonly TransitionType[] = [
	'cut',
	'dissolve',
	'fade',
	'zoom',
	'swipe',
	'whip',
	'none',
];

/** Parse + validate Pass 2 JSON output. Narrows loose string fields to enum types. */
export function parsePass2Output(
	raw: unknown,
	expected: { beatCount: number; validCharacterIds: string[] }
): AnimationBeat[] {
	if (!raw || typeof raw !== 'object') {
		throw new Error('Pass 2 output is not an object');
	}
	const r = raw as Record<string, unknown>;
	if (!Array.isArray(r.beats)) {
		throw new Error('Pass 2 output missing beats[]');
	}

	const beats: AnimationBeat[] = [];
	for (const b of r.beats as unknown[]) {
		if (!b || typeof b !== 'object') continue;
		const bb = b as Record<string, unknown>;

		const beatNumber = numberField(bb, 'beatNumber');
		const startTime = numberField(bb, 'startTime');
		const endTime = numberField(bb, 'endTime');
		const type = stringField(bb, 'type');
		const title = stringField(bb, 'title');
		const script = stringField(bb, 'script');
		const visual = stringField(bb, 'visual');
		const audio = stringField(bb, 'audio');
		const directorNotes = stringField(bb, 'directorNotes');

		const narrativeRole = enumField(bb.narrativeRole, VALID_NARRATIVE_ROLES) as NarrativeRole | undefined;
		const shotType = enumField(bb.shotType, VALID_SHOT_TYPES) as ShotType | undefined;
		const cameraMovement = enumField(bb.cameraMovement, VALID_CAMERA_MOVEMENTS) as CameraMovement | undefined;
		const transition = enumField(bb.transition, VALID_TRANSITIONS) as TransitionType | undefined;

		const characterRefs = Array.isArray(bb.characterRefs)
			? (bb.characterRefs as unknown[]).filter(
					(x): x is string => typeof x === 'string' && expected.validCharacterIds.includes(x)
				)
			: [];

		const characterAction =
			typeof bb.characterAction === 'string' ? bb.characterAction : undefined;
		const cameraAction = typeof bb.cameraAction === 'string' ? bb.cameraAction : undefined;
		const sceneSnippet = typeof bb.sceneSnippet === 'string' ? bb.sceneSnippet : undefined;
		const dialogue = typeof bb.dialogue === 'string' && bb.dialogue.trim() ? bb.dialogue : undefined;

		beats.push({
			beatNumber,
			startTime,
			endTime,
			type,
			title,
			directorNotes,
			script,
			visual,
			audio,
			shotType,
			cameraMovement,
			transition,
			narrativeRole,
			characterRefs,
			characterAction,
			cameraAction,
			sceneSnippet,
			dialogue,
		});
	}

	beats.sort((a, b) => a.beatNumber - b.beatNumber);

	if (beats.length !== expected.beatCount) {
		throw new Error(
			`Pass 2 produced ${beats.length} beats; expected ${expected.beatCount}`
		);
	}

	return beats;
}

function stringField(obj: Record<string, unknown>, field: string): string {
	const v = obj[field];
	if (typeof v !== 'string') {
		throw new Error(`Pass 2 beat missing string field '${field}'`);
	}
	return v;
}

function numberField(obj: Record<string, unknown>, field: string): number {
	const v = obj[field];
	if (typeof v !== 'number') {
		throw new Error(`Pass 2 beat missing number field '${field}'`);
	}
	return v;
}

function enumField<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
	if (typeof v !== 'string') return undefined;
	return allowed.includes(v as T) ? (v as T) : undefined;
}

export async function processBeats(input: ProcessBeatsInput): Promise<ProcessBeatsResult> {
	const { supabase, env, jobId, storyboardId, meta, totalLengthSeconds, locale } = input;

	if (!meta.beatIntents || meta.beatIntents.length === 0) {
		throw new Error('processBeats: animation_meta.beatIntents is empty; Pass 1 did not run');
	}

	await supabase
		.from('analysis_jobs')
		.update({ status: 'storyboarding', updated_at: new Date().toISOString() })
		.eq('id', jobId);

	const client = createDefaultLLMClient(env);
	const prompt = buildBeatsPrompt({
		meta,
		beatIntents: meta.beatIntents as AnimationBeatIntent[],
		totalLengthSeconds,
		locale,
	});

	const response = await client.chat(
		[{ role: 'user', content: prompt }],
		{ model: 'gemini-3-flash-preview', temperature: 0.8, maxTokens: 8192 }
	);

	const raw = extractJSON(response.content);
	const validCharIds = meta.characters.map((c) => c.id);
	const beats = parsePass2Output(raw, {
		beatCount: meta.beatIntents.length,
		validCharacterIds: validCharIds,
	});

	// Persist beats to the storyboard row.
	const { error: updateError } = await supabase
		.from('generated_storyboards')
		.update({
			generated_beats: beats,
			updated_at: new Date().toISOString(),
		})
		.eq('id', storyboardId);

	if (updateError) {
		throw new Error(`processBeats: failed to persist beats: ${updateError.message}`);
	}

	await supabase
		.from('analysis_jobs')
		.update({
			status: 'beats_complete',
			current_step: 3,
			updated_at: new Date().toISOString(),
		})
		.eq('id', jobId);

	return { beats };
}

function extractJSON(raw: string): unknown {
	let text = raw;
	const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
	if (fenceMatch) text = fenceMatch[1];

	const firstBrace = text.indexOf('{');
	if (firstBrace === -1) {
		throw new Error('No JSON object found in Pass 2 response');
	}

	let depth = 0;
	let inString = false;
	let escapeNext = false;
	for (let i = firstBrace; i < text.length; i++) {
		const ch = text[i];
		if (escapeNext) {
			escapeNext = false;
			continue;
		}
		if (ch === '\\' && inString) {
			escapeNext = true;
			continue;
		}
		if (ch === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (ch === '{') depth++;
		else if (ch === '}') {
			depth--;
			if (depth === 0) {
				const candidate = text.substring(firstBrace, i + 1);
				return JSON.parse(candidate);
			}
		}
	}
	throw new Error('Pass 2 response JSON is malformed');
}
