/**
 * Regenerate the start + end frame pair for a single animation beat.
 *
 * Mirrors the per-beat slice of process-beat-images.ts but scoped to ONE
 * beat — used by the "regenerate image" button on /storyboard/generate/[id].
 *
 * Soft-fail semantics:
 *   - If start-frame generation fails → return error, charge nothing.
 *   - If start succeeds but end fails → keep the new start, preserve the OLD
 *     end (if any) from the stored beat_images row. User can retry.
 *   - Each successful image charges one unit of IMAGE_GENERATION_COST_PER_IMAGE.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { NanaBananaClient } from '@/lib/image-generation/nana-banana-client';
import { buildImagePrompt, buildStyleContext } from '@/lib/image-generation/prompt-builder';
import type { BeatForImage, ReferenceImage } from '@/lib/image-generation/types';
import {
	chargeUserForImageGeneration,
	IMAGE_GENERATION_COST_PER_IMAGE,
} from '@/lib/storyboard-usage';
import type {
	AnimationBeat,
	AnimationCharacter,
	AnimationMeta,
} from '@/lib/types/beat';
import { expandStyleAnchor, isPhotorealStyle } from './process-beat-images';

export interface RegenerateBeatImageInput {
	supabase: SupabaseClient;
	userId: string;
	storyboardId: string;
	meta: AnimationMeta;
	beat: AnimationBeat;
	apiKey: string;
}

export interface RegenerateBeatImageResult {
	beatNumber: number;
	url: string;
	endUrl?: string;
	prompt: string;
	endPrompt?: string;
}

/**
 * Download the product hero image from the private product-assets bucket.
 * Duplicated from process-beat-images.ts so we don't export its internal
 * helpers; same logic.
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
		if (error || !data) return undefined;
		const arrayBuf = await data.arrayBuffer();
		const base64 = Buffer.from(arrayBuf).toString('base64');
		return {
			mimeType: data.type || 'image/png',
			data: base64,
			name: 'product-hero',
		};
	} catch {
		return undefined;
	}
}

async function resolveReferenceImages(
	supabase: SupabaseClient,
	beat: AnimationBeat,
	meta: AnimationMeta,
	productHeroRef: ReferenceImage | undefined
): Promise<ReferenceImage[]> {
	const out: ReferenceImage[] = [];
	if (beat.productRefs?.includes('hero') && productHeroRef) {
		out.push(productHeroRef);
	}
	const charRefs = beat.characterRefs ?? [];
	for (const charId of charRefs) {
		const char: AnimationCharacter | undefined = meta.characters.find(
			(c) => c.id === charId
		);
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
			break;
		} catch {
			continue;
		}
	}
	return out;
}

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

function buildAnimationCharacterContext(meta: AnimationMeta): string {
	if (meta.characters.length === 0) return '';
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
		if (c.sheetPrompt) lines.push(`  Full description: ${c.sheetPrompt}`);
	}
	lines.push('');
	lines.push(
		'Do NOT change the appearance of any recurring character between beats. Do NOT swap the setting or visual style.'
	);
	return lines.join('\n');
}

/**
 * Derive an end-frame intent from the beat's existing fields when Pass 2
 * didn't produce one (i.e. storyboards generated before the endFrameIntent
 * feature shipped). Always returns something usable — worst case a "subtle
 * delta" for pure static shots.
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

async function tryOnceWithRetry<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
	try {
		return { data: await fn() };
	} catch (err1) {
		await new Promise((r) => setTimeout(r, 1000));
		try {
			return { data: await fn() };
		} catch (err2) {
			return { error: err2 instanceof Error ? err2.message : String(err2) };
		}
	}
}

export async function regenerateBeatImagePair(
	input: RegenerateBeatImageInput
): Promise<RegenerateBeatImageResult> {
	const { supabase, userId, storyboardId, meta, beat, apiKey } = input;

	// useRefAsImage short-circuit: copy the user's product or character ref
	// directly as the beat frame (start = end = ref). No Gemini, no credits,
	// pixel-perfect label / brand fidelity.
	if (beat.useRefAsImage) {
		const productHeroRefForCopy = await preloadProductHero(supabase, meta);
		const copied = await copyRefAsBeatFrame(
			supabase,
			userId,
			storyboardId,
			beat,
			meta,
			productHeroRefForCopy
		);
		if (!copied.ok) {
			throw new Error(copied.error);
		}
		await supabase.rpc('update_beat_image', {
			p_storyboard_id: storyboardId,
			p_beat_number: beat.beatNumber.toString(),
			p_image_data: {
				url: copied.data.url,
				storagePath: copied.data.storagePath,
				prompt: `[ref:${beat.useRefAsImage}] copied from user upload`,
				generatedAt: new Date().toISOString(),
				endUrl: copied.data.url,
				endStoragePath: copied.data.storagePath,
				endPrompt: `[ref:${beat.useRefAsImage}] same as start`,
				endGeneratedAt: new Date().toISOString(),
				refAsImageSource: beat.useRefAsImage,
			},
		});
		return {
			beatNumber: beat.beatNumber,
			url: copied.data.url,
			endUrl: copied.data.url,
			prompt: `[ref:${beat.useRefAsImage}]`,
			endPrompt: `[ref:${beat.useRefAsImage}]`,
		};
	}

	const client = new NanaBananaClient(apiKey);
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
	const characterContext = buildAnimationCharacterContext(meta);
	const productHeroRef = await preloadProductHero(supabase, meta);
	const refs = await resolveReferenceImages(supabase, beat, meta, productHeroRef);

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

	const hasProductHeroRef = !!(beat.productRefs?.includes('hero') && productHeroRef);

	const startPrompt = buildImagePrompt(
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

	const startGen = await tryOnceWithRetry(() => client.generateImage(startPrompt, refs));
	if (startGen.error || !startGen.data) {
		throw new Error(startGen.error || 'Start-frame generation failed');
	}

	// Product insert pass: if the beat references the product, do a second
	// Gemini edit call to replace the (drifted) product with the user's
	// uploaded image. Much tighter label fidelity than single-pass gen.
	let finalStartData = startGen.data;
	let productInsertCharged = false;
	if (hasProductHeroRef && productHeroRef && meta.productContext) {
		const edited = await productInsertPass(
			client,
			finalStartData,
			productHeroRef,
			meta.productContext
		);
		if (edited) {
			finalStartData = edited;
			productInsertCharged = true;
		}
	}

	const startStoragePath = `${userId}/${storyboardId}/beat_${beat.beatNumber}.png`;
	const startBuffer = Buffer.from(finalStartData.base64, 'base64');
	const { error: startUploadError } = await supabase.storage
		.from('storyboard-images')
		.upload(startStoragePath, startBuffer, {
			contentType: finalStartData.mimeType,
			upsert: true,
		});
	if (startUploadError) {
		throw new Error(`Start-frame upload failed: ${startUploadError.message}`);
	}
	const {
		data: { publicUrl: startPublicUrl },
	} = supabase.storage.from('storyboard-images').getPublicUrl(startStoragePath);
	const startCacheBusted = `${startPublicUrl}?t=${Date.now()}`;

	await chargeUserForImageGeneration(supabase, userId);
	let creditsCharged = IMAGE_GENERATION_COST_PER_IMAGE;

	// Second charge for product-insert edit pass (only if it actually ran).
	if (productInsertCharged) {
		await chargeUserForImageGeneration(supabase, userId);
		creditsCharged += IMAGE_GENERATION_COST_PER_IMAGE;
	}

	// End frame — always attempt. If the beat has no explicit endFrameIntent
	// (old storyboards pre-dating the feature), derive one from the beat's
	// existing fields. Soft-fail: if generation blows up we keep the new start
	// and leave the old end untouched.
	let endUrl: string | undefined;
	let endPrompt: string | undefined;
	let endStoragePath: string | undefined;
	let endGeneratedAt: string | undefined;
	const endIntent = deriveEndFrameIntent(beat);
	if (endIntent) {
		endPrompt = buildEndFramePrompt({
			startPrompt,
			endIntent,
			styleAnchor: expandedStyleAnchor,
			hasProductHeroRef,
		});
		const startFrameAsRef: ReferenceImage = {
			mimeType: finalStartData.mimeType,
			data: finalStartData.base64,
			name: `beat-${beat.beatNumber}-start`,
		};
		const endRefs = [startFrameAsRef, ...refs];
		const endGen = await tryOnceWithRetry(() =>
			client.generateImage(endPrompt!, endRefs)
		);
		if (!endGen.error && endGen.data) {
			endStoragePath = `${userId}/${storyboardId}/beat_${beat.beatNumber}_end.png`;
			const endBuffer = Buffer.from(endGen.data.base64, 'base64');
			const { error: endUploadError } = await supabase.storage
				.from('storyboard-images')
				.upload(endStoragePath, endBuffer, {
					contentType: endGen.data.mimeType,
					upsert: true,
				});
			if (!endUploadError) {
				const {
					data: { publicUrl: endPublicUrl },
				} = supabase.storage
					.from('storyboard-images')
					.getPublicUrl(endStoragePath);
				endUrl = `${endPublicUrl}?t=${Date.now()}`;
				endGeneratedAt = new Date().toISOString();
				await chargeUserForImageGeneration(supabase, userId);
				creditsCharged += IMAGE_GENERATION_COST_PER_IMAGE;
			} else {
				console.warn(
					`[regenerateBeatImagePair] beat ${beat.beatNumber} end upload failed: ${endUploadError.message}`
				);
			}
		} else if (endGen.error) {
			console.warn(
				`[regenerateBeatImagePair] beat ${beat.beatNumber} end gen failed: ${endGen.error}`
			);
		}
	}

	// Persist both URLs (even if end is undefined — we overwrite the row).
	const rpcPayload: Record<string, unknown> = {
		url: startCacheBusted,
		storagePath: startStoragePath,
		prompt: startPrompt,
		generatedAt: new Date().toISOString(),
	};
	if (endUrl && endStoragePath && endPrompt && endGeneratedAt) {
		rpcPayload.endUrl = endUrl;
		rpcPayload.endStoragePath = endStoragePath;
		rpcPayload.endPrompt = endPrompt;
		rpcPayload.endGeneratedAt = endGeneratedAt;
	}
	const { error: rpcError } = await supabase.rpc('update_beat_image', {
		p_storyboard_id: storyboardId,
		p_beat_number: beat.beatNumber.toString(),
		p_image_data: rpcPayload,
	});
	if (rpcError) {
		console.error(
			`[regenerateBeatImagePair] beat ${beat.beatNumber} RPC failed: ${rpcError.message}`
		);
	}

	console.log(
		`[regenerateBeatImagePair] beat=${beat.beatNumber} charged=${creditsCharged} start=ok end=${endUrl ? 'ok' : 'skipped'}`
	);

	return {
		beatNumber: beat.beatNumber,
		url: startCacheBusted,
		endUrl,
		prompt: startPrompt,
		endPrompt,
	};
}

/**
 * Second-pass Gemini edit: take the generated scene + product reference,
 * ask Gemini to replace the (drifted) product in the scene with the real
 * product image pixel-for-pixel. Mirrors process-beat-images.ts.
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
- Place the product in the SAME screen position and orientation it occupied in image 1.
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
			'[productInsertPass/regen] edit failed:',
			err instanceof Error ? err.message : err
		);
		return null;
	}
}

/**
 * Copy the beat's reference asset (product hero or character sheet) directly
 * to storyboard-images as the beat frame. Zero Gemini calls, pixel-perfect
 * preservation. Mirrors copyRefToBeatImage in process-beat-images.ts.
 */
async function copyRefAsBeatFrame(
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
	if (!kind) return { ok: false, error: 'no useRefAsImage set' };

	let bytes: Uint8Array | undefined;
	let mimeType = 'image/png';

	if (kind === 'product') {
		if (!productHeroRef) return { ok: false, error: 'no product hero loaded' };
		bytes = Buffer.from(productHeroRef.data, 'base64');
		mimeType = productHeroRef.mimeType || 'image/png';
	} else if (kind === 'character') {
		const refId = (beat.characterRefs ?? [])[0] ?? meta.characters[0]?.id;
		const char: AnimationCharacter | undefined = meta.characters.find(
			(c) => c.id === refId
		);
		if (!char?.sheetStoragePath) {
			return { ok: false, error: 'no character sheet available' };
		}
		const { data, error } = await supabase.storage
			.from('character-sheets')
			.download(char.sheetStoragePath);
		if (error || !data) {
			return {
				ok: false,
				error: `download failed: ${error?.message ?? 'no data'}`,
			};
		}
		bytes = new Uint8Array(await data.arrayBuffer());
		mimeType = data.type || 'image/png';
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
	return {
		ok: true,
		data: { url: `${publicUrl}?t=${Date.now()}`, storagePath },
	};
}
