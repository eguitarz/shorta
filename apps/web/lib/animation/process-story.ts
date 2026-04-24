/**
 * Pass 1 orchestration: call the story LLM with the wizard spec, parse the
 * result, and persist `animation_meta` on a new generated_storyboards row.
 *
 * Hard-fails the job (status='failed') on parse error or LLM error — Pass 1
 * is cheap and its output is non-negotiable: without character sheetPrompts
 * and beat intents, Pass 2 can't run coherently. The base cost is refunded
 * in the caller on hard failure.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { buildStoryPrompt, characterId, resolveBeatRoles } from './story-prompt';
import type {
	AnimationBeatIntent,
	AnimationCharacter,
	AnimationMeta,
	AnimationWizardSpec,
	NarrativeRole,
} from '@/lib/types/beat';

export interface ProcessStoryInput {
	jobId: string;
	userId: string;
	spec: AnimationWizardSpec;
	beatCount: number;
	/** Total video length in seconds. Used by the caller, not here. */
	totalLengthSeconds: number;
	locale?: string;
	/** Optional: override beat count when Pass 1 decides a different count fits the arc. */
}

export interface ProcessStoryResult {
	storyboardId: string;
	animationMeta: AnimationMeta;
}

interface Pass1LLMOutput {
	characters: Array<{ id: string; sheetPrompt: string }>;
	beatIntents: AnimationBeatIntent[];
}

/** Parse + validate Pass 1 JSON output. Throws with a debug-friendly message. */
export function parsePass1Output(
	raw: unknown,
	expected: { characterIds: string[]; beatCount: number; allowedRoles: NarrativeRole[] }
): Pass1LLMOutput {
	if (!raw || typeof raw !== 'object') {
		throw new Error('Pass 1 output is not an object');
	}
	const r = raw as Record<string, unknown>;

	if (!Array.isArray(r.characters)) {
		throw new Error('Pass 1 output missing characters[]');
	}
	if (!Array.isArray(r.beatIntents)) {
		throw new Error('Pass 1 output missing beatIntents[]');
	}

	// Validate characters: one per expected id, in any order.
	const chars: Array<{ id: string; sheetPrompt: string }> = [];
	for (const c of r.characters as unknown[]) {
		if (!c || typeof c !== 'object') continue;
		const cc = c as Record<string, unknown>;
		if (typeof cc.id !== 'string' || typeof cc.sheetPrompt !== 'string') continue;
		if (!expected.characterIds.includes(cc.id)) continue;
		chars.push({ id: cc.id, sheetPrompt: cc.sheetPrompt.trim() });
	}
	if (chars.length !== expected.characterIds.length) {
		throw new Error(
			`Pass 1 produced ${chars.length} character sheetPrompts; expected ${expected.characterIds.length}`
		);
	}

	// Validate beatIntents: exactly beatCount entries, 1..beatCount, valid roles.
	const intents: AnimationBeatIntent[] = [];
	for (const bi of r.beatIntents as unknown[]) {
		if (!bi || typeof bi !== 'object') continue;
		const b = bi as Record<string, unknown>;
		if (typeof b.beatIndex !== 'number') continue;
		if (typeof b.narrativeRole !== 'string') continue;
		if (typeof b.intent !== 'string') continue;
		if (!expected.allowedRoles.includes(b.narrativeRole as NarrativeRole)) continue;
		intents.push({
			beatIndex: b.beatIndex,
			narrativeRole: b.narrativeRole as NarrativeRole,
			intent: b.intent.trim(),
		});
	}
	// Sort by beatIndex so downstream consumers can rely on order.
	intents.sort((a, b) => a.beatIndex - b.beatIndex);

	if (intents.length !== expected.beatCount) {
		throw new Error(
			`Pass 1 produced ${intents.length} beat intents; expected ${expected.beatCount}`
		);
	}
	// Verify beatIndex is 1..beatCount without gaps or duplicates.
	for (let i = 0; i < intents.length; i++) {
		if (intents[i].beatIndex !== i + 1) {
			throw new Error(
				`Pass 1 beatIntent at position ${i} has beatIndex ${intents[i].beatIndex}; expected ${i + 1}`
			);
		}
	}

	return { characters: chars, beatIntents: intents };
}

/**
 * Run Pass 1 end-to-end: LLM call, parse, persist.
 * Writes a new generated_storyboards row with animation_meta populated.
 * Updates the job row: status='story_complete', progress advanced.
 */
export async function processStory(
	supabase: SupabaseClient,
	env: LLMEnv,
	input: ProcessStoryInput
): Promise<ProcessStoryResult> {
	const { jobId, userId, spec, beatCount, locale } = input;

	await supabase
		.from('analysis_jobs')
		.update({ status: 'classifying', updated_at: new Date().toISOString() })
		.eq('id', jobId);

	const client = createDefaultLLMClient(env);
	const prompt = buildStoryPrompt({ spec, beatCount, locale });

	const response = await client.chat(
		[{ role: 'user', content: prompt }],
		{ model: 'gemini-3-flash-preview', temperature: 0.8, maxTokens: 4096 }
	);

	const raw = extractJSON(response.content);
	const expectedCharIds = spec.characters.map((_, i) => characterId(i));
	const allowedRoles = resolveBeatRoles(spec, beatCount);
	const parsed = parsePass1Output(raw, {
		characterIds: expectedCharIds,
		beatCount,
		allowedRoles,
	});

	// Build the final animation_meta by merging user inputs with Pass 1 output.
	// sheetStoragePath is carried from the spec when the user pre-pinned a
	// character sheet (e.g. reused a character from the product's landing page).
	// Pass 3 will skip generation for those.
	const characters: AnimationCharacter[] = spec.characters.map((c, i) => ({
		id: characterId(i),
		name: c.name,
		traits: c.traits,
		personality: c.personality,
		sheetPrompt: parsed.characters.find((p) => p.id === characterId(i))?.sheetPrompt,
		sheetStoragePath: c.sheetStoragePath,
	}));

	const animationMeta: AnimationMeta = {
		logline: spec.logline,
		tone: spec.tone,
		styleAnchor: spec.styleAnchor,
		sceneAnchor: spec.sceneAnchor,
		arcTemplate: spec.arcTemplate,
		arcCustomDescription: spec.arcCustomDescription,
		payoff: spec.payoff,
		characters,
		beatIntents: parsed.beatIntents,
		// Persist productContext into animation_meta (not just animation_spec).
		// Every downstream consumer — Pass 4, the UI toggle, export pack —
		// reads from animation_meta. Missing this here is why the "Use
		// product image" button never appeared in the plan review.
		productContext: spec.productContext,
	};

	// Create the storyboard row. Title derived from logline (first 80 chars).
	const title =
		spec.logline.length > 80 ? `${spec.logline.slice(0, 77)}…` : spec.logline;

	const { data: created, error: createError } = await supabase
		.from('generated_storyboards')
		.insert({
			user_id: userId,
			analysis_job_id: jobId,
			title,
			source: 'created',
			niche_category: null,
			content_type: 'ai_animation',
			hook_pattern: null,
			video_length_seconds: input.totalLengthSeconds,
			changes_count: 0,
			generated_overview: {
				title,
				contentType: 'ai_animation',
				nicheCategory: 'Animation',
				targetAudience: 'Short-form animation viewers',
				length: input.totalLengthSeconds,
			},
			generated_beats: [], // Populated by Pass 2
			animation_meta: animationMeta,
		})
		.select('id')
		.single();

	if (createError || !created) {
		throw new Error(
			`processStory: failed to create storyboard row: ${createError?.message || 'unknown'}`
		);
	}

	await supabase
		.from('analysis_jobs')
		.update({
			status: 'story_complete',
			current_step: 1,
			total_steps: 4,
			storyboard_result: { storyboardId: created.id },
			updated_at: new Date().toISOString(),
		})
		.eq('id', jobId);

	return { storyboardId: created.id, animationMeta };
}

/**
 * Robust JSON extraction from LLM text output. Handles markdown fences,
 * preamble, and trailing garbage. Matches gemini-client.ts behavior.
 */
function extractJSON(raw: string): unknown {
	let text = raw;
	const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
	if (fenceMatch) text = fenceMatch[1];

	const firstBrace = text.indexOf('{');
	if (firstBrace === -1) {
		throw new Error('No JSON object found in Pass 1 response');
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
	throw new Error('Pass 1 response JSON is malformed (no matching closing brace)');
}
