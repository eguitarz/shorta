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

	// Load current beat_images snapshot. Concurrent poll-triggered invocations
	// can race — this snapshot lets us skip beats that already have frames
	// written, instead of clobbering them with fresh generations. Idempotent
	// per-beat progress (no wasted credits, no stripped endUrls).
	const { data: sbSnapshot } = await supabase
		.from('generated_storyboards')
		.select('beat_images')
		.eq('id', storyboardId)
		.single();
	const existingImages =
		(sbSnapshot?.beat_images as Record<string, { url?: string; endUrl?: string }> | null) ?? {};

	const client = new NanaBananaClient(apiKey);

	// Detect photoreal styles (beauty, creator UGC, studio ad). These switch
	// the base content-type from 'ai_animation' (which says "Animated scene…")
	// to 'ai_photoreal_promo' (which says "Real person, real skin, legible
	// product labels"). Mixing the two would contradict Gemini.
	const isPhotoreal = isPhotorealStyle(meta.styleAnchor);
	const contentType: 'ai_animation' | 'ai_photoreal_promo' = isPhotoreal
		? 'ai_photoreal_promo'
		: 'ai_animation';
	const expandedStyleAnchor = expandStyleAnchor(meta.styleAnchor);

	const styleContext = buildStyleContext({
		title: isPhotoreal ? 'Photoreal Promo' : 'Animation',
		contentType,
		nicheCategory: isPhotoreal ? 'Beauty / Cosmetic / Promo' : 'Animation',
		targetAudience: 'Short-form viewers',
	});

	// Build a cross-beat character context that emphasizes the explicit character
	// definitions (not the regex-detected ones).
	const characterContext = buildAnimationCharacterContext(meta);

	// Preload the product hero reference once (if product_demo mode). Every
	// beat with productRefs:["hero"] reuses this buffer — avoids re-downloading
	// the same image from Supabase Storage on every beat.
	const productHeroRef = await preloadProductHero(supabase, meta);

	const results: BeatImageGenResult[] = [];
	let capped = false;
	let fallbackReference: ReferenceImage | undefined;

	for (const beat of beats) {
		// Idempotency: if a concurrent invocation already produced both frames
		// for this beat, skip it entirely. Avoids re-generation + the clobber
		// race where invocation B writes start-only *after* invocation A has
		// written start+end. User-visible bug was: end frames vanish on initial
		// pass because two polls serve requests in parallel and overwrite.
		const existing = existingImages[beat.beatNumber.toString()];
		if (existing?.url && existing?.endUrl) {
			console.log(
				`[processBeatImages] beat ${beat.beatNumber} already has start+end, skipping`
			);
			results.push({ beatNumber: beat.beatNumber, imageUrl: existing.url });
			continue;
		}

		// useRefAsImage: SKIP Gemini entirely. Copy the user's reference image
		// directly to beat_images. Gives 100% label/brand accuracy because
		// no pixel is regenerated — we just reuse the authoritative source.
		// Used by default on the CTA beat in product_demo mode; user can also
		// toggle this on any beat via the storyboard editor.
		if (beat.useRefAsImage) {
			const copyResult = await copyRefToBeatImage(
				supabase,
				userId,
				storyboardId,
				beat,
				meta,
				productHeroRef
			);
			if (copyResult.ok) {
				await supabase.rpc('update_beat_image', {
					p_storyboard_id: storyboardId,
					p_beat_number: beat.beatNumber.toString(),
					p_image_data: {
						url: copyResult.data.url,
						storagePath: copyResult.data.storagePath,
						prompt: `[ref:${beat.useRefAsImage}] copied from user upload`,
						generatedAt: new Date().toISOString(),
						// Start and end frames are identical for ref-as-image
						// beats. Video model can do a static hold or subtle
						// Ken-burns motion from one to the other.
						endUrl: copyResult.data.url,
						endStoragePath: copyResult.data.storagePath,
						endPrompt: `[ref:${beat.useRefAsImage}] same as start`,
						endGeneratedAt: new Date().toISOString(),
						refAsImageSource: beat.useRefAsImage,
					},
				});
				console.log(
					`[processBeatImages] beat ${beat.beatNumber} used ${beat.useRefAsImage} ref directly (no Gemini)`
				);
				results.push({
					beatNumber: beat.beatNumber,
					imageUrl: copyResult.data.url,
				});
			} else {
				console.warn(
					`[processBeatImages] beat ${beat.beatNumber} ref-copy failed: ${copyResult.error}`
				);
				results.push({
					beatNumber: beat.beatNumber,
					error: copyResult.error,
				});
			}
			continue;
		}

		// Spend-cap check BEFORE each generation.
		if (creditsSpentSoFar + IMAGE_GENERATION_COST_PER_IMAGE > MAX_CREDITS_PER_ANIMATION_JOB) {
			capped = true;
			results.push({ beatNumber: beat.beatNumber, error: 'Spend cap reached' });
			continue;
		}

		// Determine the reference image(s) for this beat. Can be:
		//   - character sheet (story mode, or product mode with mascot)
		//   - product hero (product_demo mode, reveal + feature beats)
		//   - both (product_demo mode with mascot)
		//   - fallback (first-generated-beat image) if nothing else resolves
		const refs = await resolveReferenceImages(
			supabase,
			beat,
			meta,
			productHeroRef,
			fallbackReference
		);

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

		const hasProductHeroRef = !!(
			beat.productRefs?.includes('hero') && productHeroRef
		);

		const prompt = buildImagePrompt(
			{
				title: isPhotoreal ? 'Photoreal Promo' : 'Animation',
				contentType,
				nicheCategory: isPhotoreal ? 'Beauty / Cosmetic / Promo' : 'Animation',
				targetAudience: 'Short-form viewers',
			},
			beatForImage,
			{
				styleContext: `${styleContext}\n\nSTYLE ANCHOR (apply exactly): ${expandedStyleAnchor}`,
				characterContext,
				hasReferenceImage: refs.length > 0,
				hasProductHeroRef,
			}
		);

		// Generate with one retry on failure (per Codex T3 soft-fail policy).
		const imageData = await tryOnceWithRetry(() => client.generateImage(prompt, refs));

		if (imageData.error) {
			results.push({ beatNumber: beat.beatNumber, error: imageData.error });
			continue;
		}

		// PRODUCT INSERT PASS: for beats that reference the product, do a
		// second Gemini "edit" call to replace the (possibly-drifted) product
		// in the generated scene with the user's uploaded product image.
		// Gemini preserves the scene better when given a concrete base image
		// to edit than when generating fresh with a reference. Result: label
		// fidelity that's dramatically closer to the user's upload.
		let finalStartData = imageData.data!;
		if (hasProductHeroRef && productHeroRef && meta.productContext) {
			if (
				creditsSpentSoFar + IMAGE_GENERATION_COST_PER_IMAGE <=
				MAX_CREDITS_PER_ANIMATION_JOB
			) {
				const edited = await productInsertPass(
					client,
					finalStartData,
					productHeroRef,
					meta.productContext
				);
				if (edited) {
					finalStartData = edited;
					await chargeUserForImageGeneration(supabase, userId);
					creditsSpentSoFar += IMAGE_GENERATION_COST_PER_IMAGE;
					console.log(
						`[processBeatImages] beat ${beat.beatNumber} product-insert pass succeeded`
					);
				} else {
					console.warn(
						`[processBeatImages] beat ${beat.beatNumber} product-insert pass failed, using scene as-is`
					);
				}
			}
		}

		const storagePath = `${userId}/${storyboardId}/beat_${beat.beatNumber}.png`;
		const buffer = Buffer.from(finalStartData.base64, 'base64');

		const { error: uploadError } = await supabase.storage
			.from('storyboard-images')
			.upload(storagePath, buffer, {
				contentType: finalStartData.mimeType,
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

		// Charge start-frame credits now. We'll write to DB atomically later
		// (single RPC per beat, after end frame is also generated). Delayed
		// write eliminates a race between two RPCs that would leak the endUrl.
		await chargeUserForImageGeneration(supabase, userId);
		creditsSpentSoFar += IMAGE_GENERATION_COST_PER_IMAGE;

		// First successful beat image seeds the fallback reference for any
		// subsequent beat whose characters lack sheets.
		if (!fallbackReference) {
			fallbackReference = {
				mimeType: finalStartData.mimeType,
				data: finalStartData.base64,
				name: `beat-${beat.beatNumber}-fallback-ref`,
			};
		}

		// ──────────────────────────────────────────────────────────────
		// END FRAME: if the beat has endFrameIntent + cap headroom, render
		// a second image for "first + last frame" mode in Veo 3 / Runway.
		// Uses the SAME refs as the start frame (identity lock) PLUS the
		// just-generated start frame as a third ref so Veo's interpolation
		// has continuity.
		// Soft-fail: any failure leaves the beat with only a start frame;
		// the user just gets image-to-video quality for that beat.
		// ──────────────────────────────────────────────────────────────
		let endFrameInfo: {
			url: string;
			storagePath: string;
			prompt: string;
			generatedAt: string;
		} | undefined;
		let endError: string | undefined;
		// Always try to produce an end frame. If Pass 2 didn't supply an
		// explicit endFrameIntent (old storyboards, or Gemini skipped it),
		// derive one from the beat's existing fields.
		const endIntent = deriveEndFrameIntent(beat);
		console.log(
			`[processBeatImages] beat ${beat.beatNumber} end-frame attempt (intent chars=${endIntent.length}, refs=${refs.length + 1}, hasProduct=${hasProductHeroRef})`
		);
		if (endIntent) {
			if (
				creditsSpentSoFar + IMAGE_GENERATION_COST_PER_IMAGE <=
				MAX_CREDITS_PER_ANIMATION_JOB
			) {
				const startFrameAsRef: ReferenceImage = {
					mimeType: finalStartData.mimeType,
					data: finalStartData.base64,
					name: `beat-${beat.beatNumber}-start`,
				};
				// Start frame first so the model treats it as the "previous"
				// frame; then character/product refs for identity.
				const endRefs: ReferenceImage[] = [startFrameAsRef, ...refs];

				const endPrompt = buildEndFramePrompt({
					startPrompt: prompt,
					endIntent,
					styleAnchor: expandedStyleAnchor,
					hasProductHeroRef,
				});

				const endImageData = await tryOnceWithRetry(() =>
					client.generateImage(endPrompt, endRefs)
				);

				if (!endImageData.error && endImageData.data) {
					const endStoragePath = `${userId}/${storyboardId}/beat_${beat.beatNumber}_end.png`;
					const endBuffer = Buffer.from(endImageData.data.base64, 'base64');
					const { error: endUploadError } = await supabase.storage
						.from('storyboard-images')
						.upload(endStoragePath, endBuffer, {
							contentType: endImageData.data.mimeType,
							upsert: true,
						});
					if (!endUploadError) {
						const {
							data: { publicUrl: endPublicUrl },
						} = supabase.storage
							.from('storyboard-images')
							.getPublicUrl(endStoragePath);
						const endCacheBusted = `${endPublicUrl}?t=${Date.now()}`;
						endFrameInfo = {
							url: endCacheBusted,
							storagePath: endStoragePath,
							prompt: endPrompt,
							generatedAt: new Date().toISOString(),
						};
						await chargeUserForImageGeneration(supabase, userId);
						creditsSpentSoFar += IMAGE_GENERATION_COST_PER_IMAGE;
						console.log(
							`[processBeatImages] beat ${beat.beatNumber} end-frame SUCCESS`
						);
					} else {
						endError = `upload: ${endUploadError.message}`;
						console.error(
							`[processBeatImages] beat ${beat.beatNumber} end-frame upload failed:`,
							endUploadError
						);
					}
				} else if (endImageData.error) {
					endError = `gen: ${endImageData.error}`;
					console.error(
						`[processBeatImages] beat ${beat.beatNumber} end-frame gen failed:`,
						endImageData.error
					);
				} else {
					endError = 'no data and no error (unexpected)';
					console.error(
						`[processBeatImages] beat ${beat.beatNumber} end-frame: no data and no error`
					);
				}
			} else {
				endError = 'cap would be breached';
				capped = true;
			}
		}

		// Single atomic RPC per beat: write start (+ end if we got it).
		// Merging the writes eliminates the "start-only RPC overwrites
		// start+end RPC" race that killed end frames on initial pass.
		const imagePayload: Record<string, unknown> = {
			url: cacheBusted,
			storagePath,
			prompt,
			generatedAt: new Date().toISOString(),
		};
		if (endFrameInfo) {
			imagePayload.endUrl = endFrameInfo.url;
			imagePayload.endStoragePath = endFrameInfo.storagePath;
			imagePayload.endPrompt = endFrameInfo.prompt;
			imagePayload.endGeneratedAt = endFrameInfo.generatedAt;
		} else if (endError) {
			// Surface the end-frame failure reason on the beat row so the
			// client can inspect via DevTools → Network tab. Not user-facing.
			imagePayload.endError = endError;
		}
		const { error: rpcError } = await supabase.rpc('update_beat_image', {
			p_storyboard_id: storyboardId,
			p_beat_number: beat.beatNumber.toString(),
			p_image_data: imagePayload,
		});
		if (rpcError) {
			console.error(
				`[processBeatImages] beat ${beat.beatNumber} RPC failed: ${rpcError.message}`
			);
		}

		console.log(
			`[processBeatImages] beat ${beat.beatNumber} persisted: start=${!!cacheBusted} end=${!!endFrameInfo}${endError ? ` endError=${endError}` : ''} spent=${creditsSpentSoFar}`
		);

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
 * Preload the product hero screenshot from the product-assets bucket once.
 * Returns undefined for non-product-demo jobs or when the hero is missing.
 * The result is reused across every beat with productRefs:["hero"].
 */
async function preloadProductHero(
	supabase: SupabaseClient,
	meta: AnimationMeta
): Promise<ReferenceImage | undefined> {
	const pc = meta.productContext;
	if (!pc?.heroAssetPath) return undefined;
	try {
		const { data, error } = await supabase.storage
			.from('product-assets')
			.download(pc.heroAssetPath);
		if (error || !data) {
			console.error(
				`[processBeatImages] failed to download hero ${pc.heroAssetPath}:`,
				error
			);
			return undefined;
		}
		const arrayBuf = await data.arrayBuffer();
		const base64 = Buffer.from(arrayBuf).toString('base64');
		return {
			mimeType: data.type || 'image/png',
			data: base64,
			name: 'product-hero',
		};
	} catch (err) {
		console.error('[processBeatImages] hero preload error:', err);
		return undefined;
	}
}

/**
 * Resolve reference image(s) for this beat. Multi-ref aware:
 *   - productRefs:['hero'] → push productHeroRef (preloaded once)
 *   - characterRefs → push the first sheet we can successfully fetch
 *   - Both can stack (mascot + product screenshot)
 *   - Falls back to the first-generated beat image if nothing else resolves
 */
async function resolveReferenceImages(
	supabase: SupabaseClient,
	beat: AnimationBeat,
	meta: AnimationMeta,
	productHeroRef: ReferenceImage | undefined,
	fallback: ReferenceImage | undefined
): Promise<ReferenceImage[]> {
	const out: ReferenceImage[] = [];

	// Product hero ref (if requested + available).
	if (beat.productRefs?.includes('hero') && productHeroRef) {
		out.push(productHeroRef);
	}

	// Character sheet ref (first char with a successful sheet wins).
	const charRefs = beat.characterRefs ?? [];
	for (const charId of charRefs) {
		const char: AnimationCharacter | undefined = meta.characters.find((c) => c.id === charId);
		if (!char?.sheetStoragePath) continue;
		try {
			const { data, error } = await supabase.storage
				.from('character-sheets')
				.download(char.sheetStoragePath);
			if (error || !data) continue;
			const arrayBuf = await data.arrayBuffer();
			const base64 = Buffer.from(arrayBuf).toString('base64');
			out.push({
				mimeType: data.type || 'image/png',
				data: base64,
				name: `char-sheet-${charId}`,
			});
			break; // one character sheet is enough for identity lock
		} catch (err) {
			console.error(`[processBeatImages] failed to fetch sheet for ${charId}:`, err);
			continue;
		}
	}

	// If nothing else resolved, use the legacy fallback (first-beat image).
	if (out.length === 0 && fallback) {
		out.push(fallback);
	}

	return out;
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

/**
 * Second-pass Gemini EDIT call: take the generated scene + the user's real
 * product image, ask Gemini to replace the (drifted) product in the scene
 * with the actual product image pixel-for-pixel, preserving everything
 * else (subject, pose, lighting, background). Closes most of the label-
 * fidelity gap that one-shot generation with a reference leaves open.
 *
 * Soft-fails: if the edit call errors, caller keeps the original scene
 * image (still has the drifted product, but we don't block the beat).
 */
async function productInsertPass(
	client: NanaBananaClient,
	sceneImage: { base64: string; mimeType: string },
	productHeroRef: ReferenceImage,
	pc: NonNullable<AnimationMeta['productContext']>
): Promise<{ base64: string; mimeType: string } | null> {
	const editPrompt = `You are editing the attached SCENE IMAGE (image 1). Replace any product depicted in the scene with the EXACT product shown in the PRODUCT REFERENCE (image 2).

WHAT TO PRESERVE (from image 1, unchanged):
- Subject's face, pose, hair, clothing, expression
- Background, lighting direction and temperature, color grading
- Composition, framing, camera angle, depth of field
- All visible elements other than the product itself

WHAT TO CHANGE (the product only):
- The product must match image 2 pixel-for-pixel.
- Brand/product name on the label reads: "${pc.productName}".
- All label text, logos, typography, colors, and packaging shape in image 2 must be preserved verbatim.
- Place the product in the SAME screen position and orientation it occupied in image 1 (the subject's hand, the surface, the held-up pose, etc.).
- Match the scene's lighting to the product: apply cast shadows and reflections consistent with image 1's light direction.

HARD RULES:
- Do NOT reinterpret the label text. Read image 2 carefully and reproduce label text character-for-character.
- Do NOT change the scene composition, subject, or background.
- Do NOT add text, watermarks, or UI overlays.
- Output one edited image.

RESPONSE: Return only the edited image. No commentary.`;

	const sceneRef: ReferenceImage = {
		mimeType: sceneImage.mimeType,
		data: sceneImage.base64,
		name: 'scene-to-edit',
	};
	try {
		const edited = await client.generateImage(editPrompt, [sceneRef, productHeroRef]);
		return { base64: edited.base64, mimeType: edited.mimeType };
	} catch (err) {
		console.warn(
			'[productInsertPass] edit failed:',
			err instanceof Error ? err.message : err
		);
		return null;
	}
}

/**
 * Copy a reference image (product hero or character sheet) directly into
 * the storyboard-images bucket as the beat's frame. No Gemini involvement;
 * the viewer sees the user's uploaded image verbatim, preserving all label/
 * brand detail at 100% fidelity.
 *
 * Returns { ok: true, data } on success, { ok: false, error } otherwise.
 * Soft-fails — callers fall back to AI generation if needed.
 */
async function copyRefToBeatImage(
	supabase: SupabaseClient,
	userId: string,
	storyboardId: string,
	beat: AnimationBeat,
	meta: AnimationMeta,
	productHeroRef: ReferenceImage | undefined
): Promise<
	| { ok: true; data: { url: string; storagePath: string } }
	| { ok: false; error: string }
> {
	const kind = beat.useRefAsImage;
	if (!kind) return { ok: false, error: 'beat has no useRefAsImage' };

	// Source bytes + extension.
	let bytes: Uint8Array | undefined;
	let mimeType = 'image/png';

	if (kind === 'product') {
		if (!productHeroRef) {
			return { ok: false, error: 'no product hero loaded' };
		}
		bytes = Buffer.from(productHeroRef.data, 'base64');
		mimeType = productHeroRef.mimeType || 'image/png';
	} else if (kind === 'character') {
		// Use the first available character ref with a sheet.
		const refId = (beat.characterRefs ?? [])[0] ?? meta.characters[0]?.id;
		const char: AnimationCharacter | undefined = meta.characters.find(
			(c) => c.id === refId
		);
		if (!char?.sheetStoragePath) {
			return { ok: false, error: 'no character sheet available' };
		}
		try {
			const { data, error } = await supabase.storage
				.from('character-sheets')
				.download(char.sheetStoragePath);
			if (error || !data) {
				return { ok: false, error: `download failed: ${error?.message ?? 'no data'}` };
			}
			const arrayBuf = await data.arrayBuffer();
			bytes = new Uint8Array(arrayBuf);
			mimeType = data.type || 'image/png';
		} catch (err) {
			return {
				ok: false,
				error: `character sheet download error: ${err instanceof Error ? err.message : String(err)}`,
			};
		}
	}

	if (!bytes) return { ok: false, error: 'no source bytes resolved' };

	const storagePath = `${userId}/${storyboardId}/beat_${beat.beatNumber}.png`;
	const { error: uploadError } = await supabase.storage
		.from('storyboard-images')
		.upload(storagePath, bytes, { contentType: mimeType, upsert: true });
	if (uploadError) {
		return { ok: false, error: `upload failed: ${uploadError.message}` };
	}
	const {
		data: { publicUrl },
	} = supabase.storage.from('storyboard-images').getPublicUrl(storagePath);
	const cacheBusted = `${publicUrl}?t=${Date.now()}`;
	return { ok: true, data: { url: cacheBusted, storagePath } };
}

/**
 * Detect photoreal styles (for real-person product promos — cosmetic, skincare,
 * creator UGC, studio ads). When true, Pass 4 switches the base content-type
 * prompt from "Animated scene" to "Real person, real skin, legible product
 * labels" so Gemini doesn't drift into animation territory.
 */
export function isPhotorealStyle(anchor: string | undefined): boolean {
	if (!anchor) return false;
	return /photoreal(istic)?|live[- ]action|cinematic beauty/i.test(anchor);
}

/**
 * Expand short style chip values into richer descriptions before they land
 * in the Gemini prompt. The wizard chip displays "Photoreal beauty" (short)
 * but Gemini does better with an explicit lighting/framing/texture spec.
 * Non-photoreal values pass through unchanged.
 */
export function expandStyleAnchor(anchor: string | undefined): string {
	const trimmed = (anchor ?? '').trim();
	if (!trimmed) return '';
	const lower = trimmed.toLowerCase();
	if (lower.startsWith('photoreal beauty')) {
		return 'Photoreal beauty editorial — photorealistic live-action, soft diffused beauty lighting, shallow depth of field, flawless but natural skin texture, magazine-ad quality, precise product label rendering';
	}
	if (lower.startsWith('photoreal creator')) {
		return 'Photoreal creator UGC — phone-camera aesthetic, natural daylight, authentic and casual, minimal retouching, talent feels like a real human holding the product, slightly imperfect framing';
	}
	if (lower.startsWith('photoreal studio')) {
		return 'Photoreal studio commercial — controlled studio lighting, high-contrast product isolation, pristine background, cinematic ad polish, legible product label and accurate material rendering';
	}
	if (lower.startsWith('photoreal')) {
		return 'Photorealistic live-action scene, cinematic lighting, shallow depth of field, natural skin and material textures, 9:16 vertical';
	}
	return trimmed;
}

/**
 * Derive an end-frame intent when Pass 2 didn't supply one. Always returns
 * something usable — even for pure static beats, we return a "subtle delta"
 * instruction so Veo 3 has something to interpolate.
 */
function deriveEndFrameIntent(beat: AnimationBeat): string {
	if (beat.endFrameIntent && beat.endFrameIntent.trim()) {
		return beat.endFrameIntent.trim();
	}
	const parts: string[] = [];
	if (beat.characterAction) {
		parts.push(
			`the action "${beat.characterAction.trim()}" has just completed and the character(s) hold the final position`
		);
	}
	if (beat.cameraAction && !/^\s*static\b/i.test(beat.cameraAction)) {
		parts.push(
			`the camera movement "${beat.cameraAction.trim()}" has landed in its final framing`
		);
	}
	if (beat.sceneSnippet) {
		parts.push(`scene detail: ${beat.sceneSnippet.trim()}`);
	}
	if (parts.length === 0) {
		return 'Same composition, moments later. Subtle delta only (blink, small gesture progression, slight light shift). Do not restage.';
	}
	return `Final beat state: ${parts.join('; ')}.`;
}

/**
 * Build the prompt for a beat's END frame. Takes the start-frame prompt
 * wholesale (to preserve identity/style guidance), then overrides the
 * scene-specific direction with the endFrameIntent. Emphasizes "this is the
 * same moment, AFTER the action" so the downstream video model can
 * interpolate from start → end cleanly.
 */
function buildEndFramePrompt(args: {
	startPrompt: string;
	endIntent: string;
	styleAnchor: string;
	hasProductHeroRef: boolean;
}): string {
	const { startPrompt, endIntent, styleAnchor, hasProductHeroRef } = args;
	const refNote = hasProductHeroRef
		? `\n\nREFERENCE IMAGES (attached in order):\n  1. START FRAME of this beat — match its style, lighting, character identity, and product UI exactly.\n  2. Product screenshot — preserve UI pixel-for-pixel.\n  3+. Character sheets (if any) — lock face/build/wardrobe.`
		: `\n\nREFERENCE IMAGES (attached in order):\n  1. START FRAME of this beat — match its style, lighting, character identity exactly.\n  2+. Character sheets (if any) — lock face/build/wardrobe.`;

	return `${startPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END FRAME — render the post-action state of this beat, NOT a new beat.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The image above describes the START of the beat. Now render the END frame: the exact same scene moments later, AFTER the beat's action has completed and any camera movement has landed.

END STATE (render this): ${endIntent}

STYLE ANCHOR (must match start frame): ${styleAnchor}${refNote}

HARD RULES:
- Same characters, same wardrobe, same lighting temperature, same art style as the start frame.
- Same background / environment — do NOT change the setting.
- The ONLY changes from the start frame are those implied by the action: character position, facial expression, object state, camera framing (if the beat had movement).
- If the beat is essentially static, show only a subtle delta (blink, small gesture progression). Do not stage a new composition.
- No text overlays, no watermarks, no on-screen UI chrome unless the product screenshot reference shows them.`.trim();
}

// Unused import guard (tsc otherwise flags this in tests that import helpers
// directly). Kept for parity with the generic image prompt flow.
void buildCharacterContext;
