/**
 * Step 2 orchestration: generate character sheet images via nano-banana,
 * upload to the PRIVATE character-sheets bucket, persist storagePath on
 * each character.
 *
 * Per Codex T3 (text-first delivery): soft-fail per-character. A failed
 * character doesn't block the job — we record sheetFailureReason and let
 * the pipeline proceed. Pass 2 (beats) still runs using whatever sheets
 * did succeed; beat image gen uses the sheet as reference when available
 * and falls back to first-image-as-reference when not.
 *
 * Credits are charged per successful sheet; failed sheets cost nothing.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { NanaBananaClient } from '@/lib/image-generation/nana-banana-client';
import { buildCharacterSheetImagePrompt } from './character-sheet-prompt';
import { chargeUserForImageGeneration } from '@/lib/storyboard-usage';
import type { AnimationCharacter, AnimationMeta } from '@/lib/types/beat';

export interface ProcessCharacterSheetsInput {
	supabase: SupabaseClient;
	userId: string;
	jobId: string;
	storyboardId: string;
	meta: AnimationMeta;
	apiKey: string;
}

export interface ProcessCharacterSheetsResult {
	/** Updated characters array with sheetStoragePath / sheetFailureReason populated. */
	characters: AnimationCharacter[];
	/** True when every character has a usable sheet. */
	allSucceeded: boolean;
	/** Credits charged for successful sheet generations. */
	creditsCharged: number;
}

const SHEET_COST_PER_IMAGE = 10;

export async function processCharacterSheets(
	input: ProcessCharacterSheetsInput
): Promise<ProcessCharacterSheetsResult> {
	const { supabase, userId, jobId, storyboardId, meta, apiKey } = input;

	await supabase
		.from('analysis_jobs')
		.update({ status: 'classifying', updated_at: new Date().toISOString() })
		.eq('id', jobId);

	const client = new NanaBananaClient(apiKey);
	const updatedChars: AnimationCharacter[] = [];
	let creditsCharged = 0;
	let anyFailed = false;

	for (const character of meta.characters) {
		// Pre-pinned sheet (e.g. reused avatar from product landing page).
		// Skip generation, skip credit charge, keep the existing path.
		if (character.sheetStoragePath) {
			updatedChars.push({
				...character,
				sheetGeneratedAt: character.sheetGeneratedAt ?? new Date().toISOString(),
				sheetFailureReason: undefined,
			});
			continue;
		}

		if (!character.sheetPrompt) {
			// Pass 1 didn't produce a sheetPrompt for this character; skip with
			// a recorded reason.
			updatedChars.push({
				...character,
				sheetFailureReason: 'Pass 1 did not produce sheetPrompt',
			});
			anyFailed = true;
			continue;
		}

		try {
			const prompt = buildCharacterSheetImagePrompt(character, { styleAnchor: meta.styleAnchor });
			const imageData = await client.generateImage(prompt);

			// Upload to PRIVATE character-sheets bucket.
			const storagePath = `${userId}/${storyboardId}/char_${character.id}.png`;
			const buffer = Buffer.from(imageData.base64, 'base64');

			const { error: uploadError } = await supabase.storage
				.from('character-sheets')
				.upload(storagePath, buffer, {
					contentType: imageData.mimeType,
					upsert: true,
				});

			if (uploadError) {
				throw new Error(`upload failed: ${uploadError.message}`);
			}

			updatedChars.push({
				...character,
				sheetStoragePath: storagePath,
				sheetGeneratedAt: new Date().toISOString(),
				sheetFailureReason: undefined,
			});

			// Charge credits only on success.
			await chargeUserForImageGeneration(supabase, userId);
			creditsCharged += SHEET_COST_PER_IMAGE;
		} catch (err) {
			const reason = err instanceof Error ? err.message : String(err);
			console.error(
				`[processCharacterSheets] char ${character.id} (${character.name}) failed: ${reason}`
			);
			updatedChars.push({
				...character,
				sheetFailureReason: reason,
			});
			anyFailed = true;
		}
	}

	// Persist updated characters array to animation_meta via atomic merge.
	// Caller should prefer update_animation_meta RPC for top-level merge,
	// but since characters is nested under animation_meta, we replace the
	// whole characters array in one patch.
	const { error: rpcError } = await supabase.rpc('update_animation_meta', {
		p_storyboard_id: storyboardId,
		p_patch: { characters: updatedChars },
	});
	if (rpcError) {
		throw new Error(`processCharacterSheets: update_animation_meta failed: ${rpcError.message}`);
	}

	const allSucceeded = !anyFailed;
	await supabase
		.from('analysis_jobs')
		.update({
			status: allSucceeded ? 'chars_complete' : 'chars_partial',
			current_step: 2,
			updated_at: new Date().toISOString(),
		})
		.eq('id', jobId);

	return { characters: updatedChars, allSucceeded, creditsCharged };
}

/**
 * Retry a single failed character sheet. Called from the UI retry button
 * when a user wants to try again after a partial failure. Returns the
 * updated character record.
 */
export async function retryCharacterSheet(
	supabase: SupabaseClient,
	userId: string,
	storyboardId: string,
	character: AnimationCharacter,
	styleAnchor: string,
	apiKey: string
): Promise<AnimationCharacter> {
	if (!character.sheetPrompt) {
		throw new Error(
			`retryCharacterSheet: character '${character.name}' has no sheetPrompt; cannot retry`
		);
	}

	const client = new NanaBananaClient(apiKey);
	const prompt = buildCharacterSheetImagePrompt(character, { styleAnchor });
	const imageData = await client.generateImage(prompt);

	const storagePath = `${userId}/${storyboardId}/char_${character.id}.png`;
	const buffer = Buffer.from(imageData.base64, 'base64');

	const { error: uploadError } = await supabase.storage
		.from('character-sheets')
		.upload(storagePath, buffer, {
			contentType: imageData.mimeType,
			upsert: true,
		});

	if (uploadError) {
		throw new Error(`retryCharacterSheet: upload failed: ${uploadError.message}`);
	}

	await chargeUserForImageGeneration(supabase, userId);

	return {
		...character,
		sheetStoragePath: storagePath,
		sheetGeneratedAt: new Date().toISOString(),
		sheetFailureReason: undefined,
	};
}
