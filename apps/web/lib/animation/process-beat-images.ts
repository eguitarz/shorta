/**
 * Step 4 orchestration: generate beat images using character sheets as
 * referenceImage. Uploads to the existing (public) storyboard-images bucket.
 *
 * Key difference from the generic `/api/storyboard-images/generate` flow:
 *   - The reference image is the character sheet from the private
 *     character-sheets bucket (fetched via signed URL), NOT the first
 *     generated beat image. This is what gives animation mode stronger
 *     identity consistency than the talking_head first-image-as-reference
 *     trick.
 *   - When a beat has no characterRefs (e.g., pure landscape), we fall
 *     back to first-image-as-reference per the existing behavior.
 *   - Per Codex T3, per-beat failure is NON-blocking — we retry once,
 *     then leave the slot with a retry flag for the UI to surface.
 *
 * Respects MAX_CREDITS_PER_ANIMATION_JOB: if cumulative spend exceeds the
 * cap, the pipeline halts with status='capped'. The caller passes in the
 * spend-so-far and we stop when adding IMAGE_GENERATION_COST_PER_IMAGE
 * would breach.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { NanaBananaClient } from '@/lib/image-generation/nana-banana-client';
import {
	buildCharacterContext,
	buildImagePrompt,
	buildStyleContext,
} from '@/lib/image-generation/prompt-builder';
import {
	chargeUserForImageGeneration,
	IMAGE_GENERATION_COST_PER_IMAGE,
	MAX_CREDITS_PER_ANIMATION_JOB,
} from '@/lib/storyboard-usage';
import type { BeatForImage, ReferenceImage } from '@/lib/image-generation/types';
import type {
	AnimationBeat,
	AnimationCharacter,
	AnimationMeta,
} from '@/lib/types/beat';

export interface ProcessBeatImagesInput {
	supabase: SupabaseClient;
	userId: string;
	jobId: string;
	storyboardId: string;
	meta: AnimationMeta;
	beats: AnimationBeat[];
	apiKey: string;
	/** Total credits already charged for this job (base + char sheets). */
	creditsSpentSoFar: number;
}

export interface BeatImageGenResult {
	beatNumber: number;
	imageUrl?: string;
	error?: string;
}

export interface ProcessBeatImagesResult {
	results: BeatImageGenResult[];
	allSucceeded: boolean;
	capped: boolean;
	totalSpent: number;
}

export async function processBeatImages(
	input: ProcessBeatImagesInput
): Promise<ProcessBeatImagesResult> {
	const { supabase, userId, jobId, storyboardId, meta, beats, apiKey } = input;
	let { creditsSpentSoFar } = input;

	await supabase
		.from('analysis_jobs')
		.update({ status: 'images_partial', updated_at: new Date().toISOString() })
		.eq('id', jobId);

	const client = new NanaBananaClient(apiKey);
	const styleContext = buildStyleContext({
		title: 'Animation',
		contentType: 'ai_animation',
		nicheCategory: 'Animation',
		targetAudience: 'Short-form viewers',
	});

	// Build a cross-beat character context that emphasizes the explicit character
	// definitions (not the regex-detected ones).
	const characterContext = buildAnimationCharacterContext(meta);

	const results: BeatImageGenResult[] = [];
	let capped = false;
	let fallbackReference: ReferenceImage | undefined;

	for (const beat of beats) {
		// Spend-cap check BEFORE each generation.
		if (creditsSpentSoFar + IMAGE_GENERATION_COST_PER_IMAGE > MAX_CREDITS_PER_ANIMATION_JOB) {
			capped = true;
			results.push({ beatNumber: beat.beatNumber, error: 'Spend cap reached' });
			continue;
		}

		// Determine the reference image for this beat.
		const ref = await resolveReferenceImage(supabase, beat, meta, fallbackReference);

		const beatForImage: BeatForImage = {
			beatNumber: beat.beatNumber,
			title: beat.title,
			type: beat.type,
			visual: beat.visual,
			script: beat.script,
			directorNotes: beat.directorNotes,
			shotType: beat.shotType,
			cameraMovement: beat.cameraMovement,
			bRollSuggestions: beat.bRollSuggestions,
		};

		const prompt = buildImagePrompt(
			{
				title: 'Animation',
				contentType: 'ai_animation',
				nicheCategory: 'Animation',
				targetAudience: 'Short-form viewers',
			},
			beatForImage,
			{
				styleContext: `${styleContext}\n\nSTYLE ANCHOR (apply exactly): ${meta.styleAnchor}`,
				characterContext,
				hasReferenceImage: !!ref,
			}
		);

		// Generate with one retry on failure (per Codex T3 soft-fail policy).
		const imageData = await tryOnceWithRetry(() => client.generateImage(prompt, ref));

		if (imageData.error) {
			results.push({ beatNumber: beat.beatNumber, error: imageData.error });
			continue;
		}

		const storagePath = `${userId}/${storyboardId}/beat_${beat.beatNumber}.png`;
		const buffer = Buffer.from(imageData.data!.base64, 'base64');

		const { error: uploadError } = await supabase.storage
			.from('storyboard-images')
			.upload(storagePath, buffer, {
				contentType: imageData.data!.mimeType,
				upsert: true,
			});

		if (uploadError) {
			results.push({ beatNumber: beat.beatNumber, error: `upload: ${uploadError.message}` });
			continue;
		}

		const {
			data: { publicUrl },
		} = supabase.storage.from('storyboard-images').getPublicUrl(storagePath);
		const cacheBusted = `${publicUrl}?t=${Date.now()}`;

		// Persist via existing update_beat_image RPC.
		const { error: rpcError } = await supabase.rpc('update_beat_image', {
			p_storyboard_id: storyboardId,
			p_beat_number: beat.beatNumber.toString(),
			p_image_data: {
				url: cacheBusted,
				storagePath,
				prompt,
				generatedAt: new Date().toISOString(),
			},
		});
		if (rpcError) {
			console.error(
				`[processBeatImages] beat ${beat.beatNumber} RPC failed: ${rpcError.message}`
			);
		}

		await chargeUserForImageGeneration(supabase, userId);
		creditsSpentSoFar += IMAGE_GENERATION_COST_PER_IMAGE;

		// First successful beat image seeds the fallback reference for any
		// subsequent beat whose characters lack sheets.
		if (!fallbackReference) {
			fallbackReference = {
				mimeType: imageData.data!.mimeType,
				data: imageData.data!.base64,
				name: `beat-${beat.beatNumber}-fallback-ref`,
			};
		}

		results.push({ beatNumber: beat.beatNumber, imageUrl: cacheBusted });
	}

	const allSucceeded = results.every((r) => !!r.imageUrl);
	const finalStatus = capped ? 'capped' : allSucceeded ? 'completed' : 'images_partial';

	await supabase
		.from('analysis_jobs')
		.update({
			status: finalStatus,
			current_step: 4,
			completed_at: allSucceeded ? new Date().toISOString() : null,
			updated_at: new Date().toISOString(),
		})
		.eq('id', jobId);

	return { results, allSucceeded, capped, totalSpent: creditsSpentSoFar };
}

/**
 * Resolve which image to use as referenceImage for this beat.
 *   - If the beat has characterRefs AND at least one of those chars has a
 *     successful sheetStoragePath: fetch the sheet from the private bucket
 *     and use it as reference.
 *   - Otherwise, fall back to the first-generated-beat image (the legacy
 *     consistency trick).
 */
async function resolveReferenceImage(
	supabase: SupabaseClient,
	beat: AnimationBeat,
	meta: AnimationMeta,
	fallback: ReferenceImage | undefined
): Promise<ReferenceImage | undefined> {
	const refs = beat.characterRefs ?? [];
	if (refs.length === 0) return fallback;

	// Prefer the first referenced character that actually has a sheet.
	for (const charId of refs) {
		const char: AnimationCharacter | undefined = meta.characters.find((c) => c.id === charId);
		if (!char?.sheetStoragePath) continue;

		try {
			const { data, error } = await supabase.storage
				.from('character-sheets')
				.download(char.sheetStoragePath);

			if (error || !data) continue;

			const arrayBuf = await data.arrayBuffer();
			const base64 = Buffer.from(arrayBuf).toString('base64');
			return {
				mimeType: data.type || 'image/png',
				data: base64,
				name: `char-sheet-${charId}`,
			};
		} catch (err) {
			console.error(`[processBeatImages] failed to fetch sheet for ${charId}:`, err);
			continue;
		}
	}

	return fallback;
}

/**
 * Try an async operation; on failure, retry once with a short backoff.
 * Returns { data } on success or { error } on final failure.
 */
async function tryOnceWithRetry<T>(
	fn: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
	try {
		const data = await fn();
		return { data };
	} catch (err1) {
		await new Promise((r) => setTimeout(r, 1000));
		try {
			const data = await fn();
			return { data };
		} catch (err2) {
			const msg = err2 instanceof Error ? err2.message : String(err2);
			return { error: msg };
		}
	}
}

/**
 * Animation-mode character context for the image prompt. Unlike the generic
 * buildCharacterContext (which does regex detection), this one injects the
 * explicit character definitions from AnimationMeta.
 */
function buildAnimationCharacterContext(meta: AnimationMeta): string {
	if (meta.characters.length === 0) {
		return '';
	}

	const lines: string[] = [
		'CHARACTER IDENTITY (CRITICAL — apply to EVERY image):',
		`All images are frames from the SAME animated short. Style: ${meta.styleAnchor}.`,
		`Setting: ${meta.sceneAnchor}.`,
		'',
		'Characters (maintain identical appearance across all beats):',
	];

	for (const c of meta.characters) {
		const traits = c.traits.length ? c.traits.join(', ') : '(no traits specified)';
		lines.push(`- ${c.name} (id=${c.id}): ${traits}. ${c.personality}`);
		if (c.sheetPrompt) {
			lines.push(`  Full description: ${c.sheetPrompt}`);
		}
	}

	lines.push('');
	lines.push(
		'Do NOT change the appearance of any recurring character between beats. Do NOT swap the setting or visual style.'
	);

	return lines.join('\n');
}

// Unused import guard (tsc otherwise flags this in tests that import helpers
// directly). Kept for parity with the generic image prompt flow.
void buildCharacterContext;
