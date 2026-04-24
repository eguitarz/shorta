/**
 * POST /api/animation/beat/toggle-ref-image
 *
 * Toggle a beat's `useRefAsImage` flag. When enabled, Pass 4 skips Gemini
 * generation for this beat and copies the user's reference asset (product
 * hero or character sheet) directly to the beat's frame — 100% label /
 * brand fidelity. When disabled, beat reverts to AI-generated frames.
 *
 * This is the "100% accurate product hero" toggle the user flips from the
 * storyboard editor. Saves the flag into `generated_beats` (authoritative)
 * AND immediately re-runs the beat's image generation so the state in
 * beat_images reflects the toggle without a separate regen click.
 *
 * Body: {
 *   storyboardId: string,
 *   beatNumber: number,
 *   useRefAsImage: 'product' | 'character' | null,
 * }
 * Response: { beatImage: BeatImageData, useRefAsImage }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { regenerateBeatImagePair } from '@/lib/animation/regenerate-beat-image';
import type { AnimationBeat, AnimationMeta } from '@/lib/types/beat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
	try {
		const csrf = validateCsrf(request);
		if (!csrf.isValid) {
			return NextResponse.json(
				{ error: csrf.error || 'CSRF validation failed' },
				{ status: 403 }
			);
		}
		const user = await getAuthenticatedUser(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const rateLimited = rateLimitByUser(RateLimits.AI, user.id);
		if (rateLimited) return rateLimited;

		const body = await request.json();
		const storyboardId = typeof body?.storyboardId === 'string' ? body.storyboardId : '';
		const beatNumber = Number(body?.beatNumber);
		const raw = body?.useRefAsImage;
		const next: 'product' | 'character' | null =
			raw === 'product' || raw === 'character' ? raw : null;
		if (!storyboardId || !Number.isFinite(beatNumber) || beatNumber < 1) {
			return NextResponse.json(
				{ error: 'storyboardId and beatNumber are required' },
				{ status: 400 }
			);
		}

		const cookieStore = await cookies();
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						try {
							cookiesToSet.forEach(({ name, value, options }) =>
								cookieStore.set(name, value, options)
							);
						} catch {
							// ignore
						}
					},
				},
			}
		);

		const { data: sb, error: sbErr } = await supabase
			.from('generated_storyboards')
			.select('id, user_id, animation_meta, generated_beats, beat_images')
			.eq('id', storyboardId)
			.single();
		if (sbErr || !sb) {
			return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 });
		}
		if (sb.user_id !== user.id) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		if (!sb.animation_meta) {
			return NextResponse.json(
				{ error: 'Not an animation storyboard' },
				{ status: 400 }
			);
		}

		const meta = sb.animation_meta as AnimationMeta;
		const beats = (sb.generated_beats as AnimationBeat[]) ?? [];
		const idx = beats.findIndex((b) => b.beatNumber === beatNumber);
		if (idx < 0) {
			return NextResponse.json(
				{ error: `Beat ${beatNumber} not found` },
				{ status: 404 }
			);
		}

		// Sanity: if flipping to 'product', storyboard MUST have productContext.
		if (next === 'product' && !meta.productContext) {
			return NextResponse.json(
				{
					error: 'Cannot use product image: no product was uploaded for this storyboard.',
				},
				{ status: 400 }
			);
		}
		// Sanity: if flipping to 'character', beat needs characterRefs OR the
		// storyboard needs at least one character with a sheetStoragePath.
		if (next === 'character') {
			const anyRef = (beats[idx].characterRefs ?? [])[0];
			const char =
				meta.characters.find((c) => c.id === anyRef) ?? meta.characters[0];
			if (!char?.sheetStoragePath) {
				return NextResponse.json(
					{ error: 'No character sheet available to use as beat image.' },
					{ status: 400 }
				);
			}
		}

		// Persist the flag on the beat.
		const updatedBeats = beats.map((b, i) =>
			i === idx ? { ...b, useRefAsImage: next ?? undefined } : b
		);
		const { error: updateErr } = await supabase
			.from('generated_storyboards')
			.update({ generated_beats: updatedBeats })
			.eq('id', storyboardId);
		if (updateErr) {
			return NextResponse.json(
				{ error: `Failed to save flag: ${updateErr.message}` },
				{ status: 500 }
			);
		}

		// Plan-review shortcut: if there are NO beat images yet for this
		// storyboard (user hasn't clicked "Generate images" yet), we're in
		// the plan-review phase. Just save the flag and return — we'll
		// respect it when Pass 4 fires. No Gemini calls, no credits.
		const currentImages =
			(sb.beat_images as Record<string, { url?: string }> | null) ?? {};
		const hasAnyImage = Object.keys(currentImages).length > 0;
		if (!hasAnyImage) {
			return NextResponse.json(
				{
					beatImage: null,
					useRefAsImage: next,
					planReview: true,
				},
				{ status: 200 }
			);
		}

		// Post-generation: re-run this beat's image. regenerateBeatImagePair
		// handles BOTH paths:
		//   - When beat.useRefAsImage is set → copies the ref asset (no Gemini)
		//   - When null → full AI start + end gen
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: 'GEMINI_API_KEY missing on server' },
				{ status: 500 }
			);
		}
		const effectiveBeat: AnimationBeat = {
			...beats[idx],
			useRefAsImage: next ?? undefined,
		};
		const result = await regenerateBeatImagePair({
			supabase: supabase as unknown as Parameters<typeof regenerateBeatImagePair>[0]['supabase'],
			userId: user.id,
			storyboardId,
			meta,
			beat: effectiveBeat,
			apiKey,
		});

		return NextResponse.json(
			{
				beatImage: {
					url: result.url,
					endUrl: result.endUrl,
					prompt: result.prompt,
					endPrompt: result.endPrompt,
				},
				useRefAsImage: next,
			},
			{ status: 200 }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/beat/toggle-ref-image] error:', message);
		return NextResponse.json(
			{ error: 'Toggle failed', message },
			{ status: 500 }
		);
	}
}
