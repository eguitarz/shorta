/**
 * POST /api/animation/beat/toggle-product-ref
 *
 * Toggle whether a beat uses the product image as a Gemini REFERENCE during
 * image generation. This is a flag-only update — does NOT regenerate the
 * beat's image. The client shows a "Regenerate to apply" notice when the
 * beat already has a generated image but the flag has changed.
 *
 * Body: {
 *   storyboardId: string,
 *   beatNumber: number,
 *   reference: boolean,   // true = add 'hero' to productRefs; false = remove
 * }
 * Response: { productRefs: string[], beatHasImage: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
		const storyboardId =
			typeof body?.storyboardId === 'string' ? body.storyboardId : '';
		const beatNumber = Number(body?.beatNumber);
		const reference = body?.reference === true;
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
		if (reference && !meta.productContext) {
			return NextResponse.json(
				{
					error:
						'Cannot reference product: no product uploaded to this storyboard. Upload a product image first.',
				},
				{ status: 400 }
			);
		}

		const beats = (sb.generated_beats as AnimationBeat[]) ?? [];
		const idx = beats.findIndex((b) => b.beatNumber === beatNumber);
		if (idx < 0) {
			return NextResponse.json(
				{ error: `Beat ${beatNumber} not found` },
				{ status: 404 }
			);
		}

		// Toggle productRefs: ['hero'] on/off. Keep other refs intact if any
		// future code introduces them.
		const existingRefs = beats[idx].productRefs ?? [];
		const nextRefs = reference
			? Array.from(new Set([...existingRefs, 'hero'])) as Array<'hero'>
			: (existingRefs.filter((r) => r !== 'hero') as Array<'hero'>);

		const updatedBeats = beats.map((b, i) =>
			i === idx
				? { ...b, productRefs: nextRefs.length ? nextRefs : undefined }
				: b
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

		// Check if the beat has an existing image — if yes, the client should
		// show a "Regenerate to apply" notice.
		const beatImages =
			(sb.beat_images as Record<string, { url?: string }> | null) ?? {};
		const beatHasImage = !!beatImages[String(beatNumber)]?.url;

		return NextResponse.json(
			{
				productRefs: nextRefs,
				beatHasImage,
			},
			{ status: 200 }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/beat/toggle-product-ref] error:', message);
		return NextResponse.json(
			{ error: 'Toggle failed', message },
			{ status: 500 }
		);
	}
}
