/**
 * GET /api/jobs/animation-storyboard/[job_id]
 *
 * Poll-driven step runner for the animation pipeline. Mirrors the pattern used
 * by /api/jobs/analysis/[job_id]: each GET advances the job by ONE step based
 * on current status, then returns the latest state. The client polls every 3s.
 *
 * Step transitions:
 *   pending             → processStory              → story_complete
 *   story_complete      → processCharacterSheets    → chars_complete | chars_partial
 *   chars_complete|chars_partial → processBeats     → beats_complete (VIEW/EXPORT OK)
 *   beats_complete|images_partial → processBeatImages → completed | images_partial | capped
 *
 * Terminal states (no further work): completed, failed, capped, stale.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { LLMEnv } from '@/lib/llm';
import { processStory } from '@/lib/animation/process-story';
import { processCharacterSheets } from '@/lib/animation/process-character-sheets';
import { processBeats } from '@/lib/animation/process-beats';
import { processBeatImages } from '@/lib/animation/process-beat-images';
import {
	ANIMATION_STORYBOARD_BASE_COST,
	chargeCredits,
} from '@/lib/storyboard-usage';
import type {
	AnimationBeat,
	AnimationMeta,
	AnimationWizardSpec,
} from '@/lib/types/beat';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min per step (Cloudflare wall cap)

const TERMINAL = new Set(['completed', 'failed', 'capped', 'stale']);

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ job_id: string }> }
) {
	const user = await getAuthenticatedUser(request);
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { job_id } = await params;
		const locale = request.nextUrl.searchParams.get('locale') || 'en';

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
							// API route - ignore cookie setting errors
						}
					},
				},
			}
		);

		// Fetch the job.
		const { data: job, error: fetchError } = await supabase
			.from('analysis_jobs')
			.select('*')
			.eq('id', job_id)
			.single();

		if (fetchError || !job) {
			return NextResponse.json({ error: 'Job not found' }, { status: 404 });
		}

		if (job.kind !== 'animation') {
			return NextResponse.json(
				{ error: 'Not an animation job — use /api/jobs/analysis/[job_id]' },
				{ status: 400 }
			);
		}

		if (job.user_id !== user.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
		}

		// If already terminal, just return state.
		if (TERMINAL.has(job.status)) {
			return NextResponse.json(await buildResponse(supabase, job));
		}

		const env: LLMEnv = {
			GEMINI_API_KEY: process.env.GEMINI_API_KEY,
			LLM_MODEL: process.env.LLM_MODEL,
		};
		const apiKey = process.env.GEMINI_API_KEY || '';

		try {
			switch (job.status) {
				case 'pending':
					await runStory(supabase, env, job, locale);
					break;

				case 'story_complete':
					await runCharacterSheets(supabase, job, apiKey);
					break;

				case 'chars_complete':
				case 'chars_partial':
					await runBeats(supabase, env, job, locale);
					break;

				case 'beats_complete':
				case 'images_partial':
					await runBeatImages(supabase, job, apiKey);
					break;

				// Interim processing states — the watchdog handles stuck jobs.
				case 'classifying':
				case 'storyboarding':
					// A prior request is running this step. Return current state.
					break;

				default:
					// Unknown or legacy status — treat as no-op.
					break;
			}
		} catch (stepError) {
			const msg = stepError instanceof Error ? stepError.message : String(stepError);
			console.error(`[Animation Job ${job_id}] step failed:`, stepError);

			// Hard-fail: mark job and refund what's safe to refund.
			await supabase
				.from('analysis_jobs')
				.update({
					status: 'failed',
					error_message: msg.slice(0, 500),
					updated_at: new Date().toISOString(),
				})
				.eq('id', job_id);

			// Refund base cost if we hadn't yet started delivering real value.
			if (job.status === 'pending' || job.status === 'classifying') {
				await chargeCredits(supabase, user.id, -ANIMATION_STORYBOARD_BASE_COST);
			}

			// Return the updated state; client sees status='failed'.
			const { data: updated } = await supabase
				.from('analysis_jobs')
				.select('*')
				.eq('id', job_id)
				.single();
			return NextResponse.json(await buildResponse(supabase, updated || job));
		}

		// Re-fetch and return the updated state.
		const { data: updated } = await supabase
			.from('analysis_jobs')
			.select('*')
			.eq('id', job_id)
			.single();

		return NextResponse.json(await buildResponse(supabase, updated || job));
	} catch (error) {
		console.error('[Animation Job GET] API error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
}

// ────────────────────────────────────────────────────────────────────────────
// Step runners (thin wrappers around process-* modules)
// ────────────────────────────────────────────────────────────────────────────

async function runStory(
	supabase: ReturnType<typeof createServerClient>,
	env: LLMEnv,
	job: any,
	locale: string
) {
	const spec = job.animation_spec as AnimationWizardSpec & {
		beatCount: number;
		totalLengthSeconds: number;
	};
	await processStory(supabase as any, env, {
		jobId: job.id,
		userId: job.user_id,
		spec: {
			logline: spec.logline,
			tone: spec.tone,
			styleAnchor: spec.styleAnchor,
			sceneAnchor: spec.sceneAnchor,
			arcTemplate: spec.arcTemplate,
			arcCustomDescription: spec.arcCustomDescription,
			payoff: spec.payoff,
			characters: spec.characters,
		},
		beatCount: spec.beatCount,
		totalLengthSeconds: spec.totalLengthSeconds,
		locale,
	});
}

async function runCharacterSheets(
	supabase: ReturnType<typeof createServerClient>,
	job: any,
	apiKey: string
) {
	const storyboardId = job.storyboard_result?.storyboardId;
	if (!storyboardId) {
		throw new Error('runCharacterSheets: storyboardId missing — processStory did not complete');
	}

	// Fetch animation_meta for the storyboard.
	const { data: sb, error } = await (supabase as any)
		.from('generated_storyboards')
		.select('animation_meta')
		.eq('id', storyboardId)
		.single();

	if (error || !sb?.animation_meta) {
		throw new Error('runCharacterSheets: animation_meta not found');
	}

	await processCharacterSheets({
		supabase: supabase as any,
		userId: job.user_id,
		jobId: job.id,
		storyboardId,
		meta: sb.animation_meta as AnimationMeta,
		apiKey,
	});
}

async function runBeats(
	supabase: ReturnType<typeof createServerClient>,
	env: LLMEnv,
	job: any,
	locale: string
) {
	const storyboardId = job.storyboard_result?.storyboardId;
	if (!storyboardId) {
		throw new Error('runBeats: storyboardId missing');
	}

	const { data: sb, error } = await (supabase as any)
		.from('generated_storyboards')
		.select('animation_meta, video_length_seconds')
		.eq('id', storyboardId)
		.single();

	if (error || !sb?.animation_meta) {
		throw new Error('runBeats: animation_meta not found');
	}

	await processBeats({
		supabase: supabase as any,
		env,
		jobId: job.id,
		storyboardId,
		meta: sb.animation_meta as AnimationMeta,
		totalLengthSeconds: sb.video_length_seconds ?? 30,
		locale,
	});
}

async function runBeatImages(
	supabase: ReturnType<typeof createServerClient>,
	job: any,
	apiKey: string
) {
	const storyboardId = job.storyboard_result?.storyboardId;
	if (!storyboardId) {
		throw new Error('runBeatImages: storyboardId missing');
	}

	const { data: sb, error } = await (supabase as any)
		.from('generated_storyboards')
		.select('animation_meta, generated_beats')
		.eq('id', storyboardId)
		.single();

	if (error || !sb?.animation_meta || !sb?.generated_beats) {
		throw new Error('runBeatImages: storyboard not ready');
	}

	const meta = sb.animation_meta as AnimationMeta;
	const beats = sb.generated_beats as AnimationBeat[];

	// Credits spent so far: base + per successful char sheet.
	const spentSoFar =
		ANIMATION_STORYBOARD_BASE_COST +
		10 * meta.characters.filter((c) => c.sheetStoragePath).length;

	await processBeatImages({
		supabase: supabase as any,
		userId: job.user_id,
		jobId: job.id,
		storyboardId,
		meta,
		beats,
		apiKey,
		creditsSpentSoFar: spentSoFar,
	});
}

// ────────────────────────────────────────────────────────────────────────────
// Response builder
// ────────────────────────────────────────────────────────────────────────────

async function buildResponse(
	supabase: ReturnType<typeof createServerClient>,
	job: any
) {
	const storyboardId = job.storyboard_result?.storyboardId;

	let storyboard: any = null;
	if (storyboardId) {
		const { data } = await (supabase as any)
			.from('generated_storyboards')
			.select('id, title, animation_meta, generated_beats, beat_images')
			.eq('id', storyboardId)
			.single();
		storyboard = data;
	}

	return {
		job_id: job.id,
		status: job.status,
		kind: job.kind,
		current_step: job.current_step,
		total_steps: job.total_steps,
		error_message: job.error_message,
		storyboard_id: storyboardId ?? null,
		storyboard,
		created_at: job.created_at,
		updated_at: job.updated_at,
		completed_at: job.completed_at,
	};
}
