/**
 * POST /api/animation/beat-image/regenerate
 *
 * Regenerate the start + end frame pair for one beat in an animation
 * storyboard. Preserves the animation-mode ref-image stacking (character
 * sheets + product hero) that the generic /api/storyboard-images/generate
 * endpoint doesn't do.
 *
 * Body: { storyboardId: string, beatNumber: number }
 * Response: { url, endUrl?, prompt, endPrompt?, beatNumber }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
	hasSufficientCreditsForImageGeneration,
	IMAGE_GENERATION_COST_PER_IMAGE,
} from '@/lib/storyboard-usage';
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

		const { data: sb, error: loadErr } = await supabase
			.from('generated_storyboards')
			.select('id, user_id, animation_meta, generated_beats')
			.eq('id', storyboardId)
			.single();
		if (loadErr || !sb) {
			return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 });
		}
		if (sb.user_id !== user.id) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		if (!sb.animation_meta) {
			return NextResponse.json(
				{ error: 'Regenerate pair is only available for animation storyboards' },
				{ status: 400 }
			);
		}

		const meta = sb.animation_meta as AnimationMeta;
		const beats = (sb.generated_beats as AnimationBeat[]) ?? [];
		const beat = beats.find((b) => b.beatNumber === beatNumber);
		if (!beat) {
			return NextResponse.json(
				{ error: `Beat ${beatNumber} not found` },
				{ status: 404 }
			);
		}

		// Worst case: 2 images (start + derived end frame). The pair is always
		// attempted; if the beat has no characterAction / cameraAction we still
		// generate a subtle-delta end frame so Veo 3 has a last frame to
		// interpolate to.
		const enough = await hasSufficientCreditsForImageGeneration(
			supabase,
			user.id,
			2
		);
		if (!enough) {
			return NextResponse.json(
				{
					error: 'Insufficient credits',
					message: `Regenerating this beat costs up to ${2 * IMAGE_GENERATION_COST_PER_IMAGE} credits (start + end frame).`,
				},
				{ status: 403 }
			);
		}

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: 'GEMINI_API_KEY missing on server' },
				{ status: 500 }
			);
		}

		const result = await regenerateBeatImagePair({
			supabase,
			userId: user.id,
			storyboardId,
			meta,
			beat,
			apiKey,
		});

		return NextResponse.json(result, { status: 200 });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/beat-image/regenerate] error:', message);
		return NextResponse.json(
			{ error: 'Regenerate failed', message },
			{ status: 500 }
		);
	}
}
