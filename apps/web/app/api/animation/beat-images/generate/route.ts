/**
 * POST /api/animation/beat-images/generate
 *
 * Batch-generate start + end frame pairs for ALL beats of an animation
 * storyboard. Wraps processBeatImages with auth/ownership/credit checks.
 *
 * This replaces the generate page's old call to the generic
 * /api/storyboard-images/generate route for animation storyboards. The
 * generic route only produces one image per beat and has no concept of
 * end frames, character-sheet pinning, or product-hero refs — all of
 * which matter for animation mode.
 *
 * Idempotent: beats already fully generated (both url + endUrl) are
 * skipped inside processBeatImages. Safe to call multiple times.
 *
 * Body: { storyboardId: string }
 * Response: { beatImages: BeatImageMap, completed: number, total: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
	hasSufficientCreditsForImageGeneration,
	ANIMATION_STORYBOARD_BASE_COST,
} from '@/lib/storyboard-usage';
import { processBeatImages } from '@/lib/animation/process-beat-images';
import type {
	AnimationBeat,
	AnimationMeta,
} from '@/lib/types/beat';
import type { BeatImageMap } from '@/lib/image-generation/types';

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
		if (!storyboardId) {
			return NextResponse.json(
				{ error: 'storyboardId is required' },
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

		// Load the storyboard.
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
				{ error: 'Not an animation storyboard — use /api/storyboard-images/generate' },
				{ status: 400 }
			);
		}

		const meta = sb.animation_meta as AnimationMeta;
		const beats = (sb.generated_beats as AnimationBeat[]) ?? [];
		if (!Array.isArray(beats) || beats.length === 0) {
			return NextResponse.json(
				{ error: 'Storyboard has no beats yet — wait for beats_complete' },
				{ status: 400 }
			);
		}

		// Find the job row for this storyboard (needed for status updates
		// inside processBeatImages). Looks up by the storyboard_result JSONB
		// path that process-story.ts wrote.
		const { data: job } = await supabase
			.from('analysis_jobs')
			.select('id, status')
			.eq('user_id', user.id)
			.eq('kind', 'animation')
			.filter('storyboard_result->>storyboardId', 'eq', storyboardId)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();
		if (!job) {
			return NextResponse.json(
				{
					error:
						'No animation job found for this storyboard. Generate via the wizard first.',
				},
				{ status: 404 }
			);
		}

		// Worst-case credit check: every missing beat frame × cost. Skips beats
		// already fully generated; only charges for the ones we actually work.
		const existing =
			(sb.beat_images as Record<
				string,
				{ url?: string; endUrl?: string }
			> | null) ?? {};
		let needed = 0;
		for (const b of beats) {
			const e = existing[String(b.beatNumber)];
			if (!e?.url) needed += 1; // start frame to generate
			if (!e?.endUrl) needed += 1; // end frame to generate
		}
		if (needed === 0) {
			return NextResponse.json(
				{
					beatImages: existing,
					completed: beats.length,
					total: beats.length,
					message: 'All beats already have start + end frames',
				},
				{ status: 200 }
			);
		}
		const enough = await hasSufficientCreditsForImageGeneration(
			supabase,
			user.id,
			needed
		);
		if (!enough) {
			return NextResponse.json(
				{
					error: 'Insufficient credits',
					message: `Need up to ${needed * 10} credits to finish this storyboard's images.`,
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

		// spentSoFar calculation mirrors runBeatImages in the job-polling route:
		// base + per-character-sheet charge. Only used for cap enforcement
		// inside processBeatImages; doesn't actually charge the user again.
		const spentSoFar =
			ANIMATION_STORYBOARD_BASE_COST +
			10 * meta.characters.filter((c) => c.sheetStoragePath).length;

		await processBeatImages({
			supabase: supabase as unknown as Parameters<typeof processBeatImages>[0]['supabase'],
			userId: user.id,
			jobId: job.id,
			storyboardId,
			meta,
			beats,
			apiKey,
			creditsSpentSoFar: spentSoFar,
		});

		// Re-read the storyboard to return the fresh beat_images.
		const { data: fresh } = await supabase
			.from('generated_storyboards')
			.select('beat_images')
			.eq('id', storyboardId)
			.single();
		const beatImages = (fresh?.beat_images as BeatImageMap) ?? {};

		return NextResponse.json(
			{
				beatImages,
				completed: Object.keys(beatImages).length,
				total: beats.length,
			},
			{ status: 200 }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/beat-images/generate] error:', message);
		return NextResponse.json(
			{ error: 'Batch generate failed', message },
			{ status: 500 }
		);
	}
}
