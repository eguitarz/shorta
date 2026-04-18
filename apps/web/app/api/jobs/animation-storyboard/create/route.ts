/**
 * POST /api/jobs/animation-storyboard/create
 *
 * Creates a new animation storyboard job. Validates the wizard spec, checks
 * feature flag + credits, charges the base cost, and inserts a row with
 * kind='animation' + animation_spec. Returns { job_id } immediately; the
 * actual processing happens in subsequent polls of GET /[job_id].
 *
 * Auth required. Anonymous users cannot create animation jobs (unlike video
 * analysis, which has a free trial — animation is premium-only in v1).
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
	hasSufficientCreditsForAnimationStoryboard,
	chargeAnimationStoryboardBase,
	ANIMATION_STORYBOARD_BASE_COST,
} from '@/lib/storyboard-usage';
import { isAnimationModeEnabled } from '@/lib/feature-flags';
import type { AnimationWizardSpec, ArcTemplateId } from '@/lib/types/beat';

export const dynamic = 'force-dynamic';

const VALID_ARC_TEMPLATES: readonly ArcTemplateId[] = [
	'setup_twist_payoff',
	'problem_escalation_resolution',
	'loop',
	'reveal',
	'reversal',
	'chase_build',
	'custom',
];

/** Validate and normalize wizard input. Returns the normalized spec or a user-safe error message. */
function validateSpec(
	body: unknown
): { ok: true; spec: AnimationWizardSpec; beatCount: number; totalLengthSeconds: number } | { ok: false; error: string } {
	if (!body || typeof body !== 'object') {
		return { ok: false, error: 'Request body is required' };
	}
	const b = body as Record<string, unknown>;

	const logline = typeof b.logline === 'string' ? b.logline.trim() : '';
	if (logline.length < 10) return { ok: false, error: 'Logline must be at least 10 characters' };
	if (logline.length > 500) return { ok: false, error: 'Logline must be 500 characters or fewer' };

	const tone = typeof b.tone === 'string' ? b.tone.trim() : '';
	if (!tone) return { ok: false, error: 'Tone is required' };

	const styleAnchor = typeof b.styleAnchor === 'string' ? b.styleAnchor.trim() : '';
	if (!styleAnchor) return { ok: false, error: 'Visual style is required' };

	const sceneAnchor = typeof b.sceneAnchor === 'string' ? b.sceneAnchor.trim() : '';
	if (!sceneAnchor) return { ok: false, error: 'Setting is required' };

	const arcTemplate = typeof b.arcTemplate === 'string' ? (b.arcTemplate as ArcTemplateId) : 'setup_twist_payoff';
	if (!VALID_ARC_TEMPLATES.includes(arcTemplate)) {
		return { ok: false, error: `Invalid arc template '${arcTemplate}'` };
	}

	const arcCustomDescription =
		arcTemplate === 'custom' && typeof b.arcCustomDescription === 'string'
			? b.arcCustomDescription.trim()
			: undefined;
	if (arcTemplate === 'custom' && !arcCustomDescription) {
		return { ok: false, error: 'Custom arc requires an arc description' };
	}

	const payoff = typeof b.payoff === 'string' ? b.payoff.trim() : '';
	if (payoff.length < 5) return { ok: false, error: 'Payoff must be at least 5 characters' };

	if (!Array.isArray(b.characters) || b.characters.length === 0) {
		return { ok: false, error: 'At least one character is required' };
	}
	if (b.characters.length > 2) {
		return { ok: false, error: 'v1 supports 1-2 characters only' };
	}

	const characters = b.characters.map((raw, i) => {
		if (!raw || typeof raw !== 'object') {
			throw new Error(`Character ${i + 1} is malformed`);
		}
		const r = raw as Record<string, unknown>;
		const name = typeof r.name === 'string' ? r.name.trim() : '';
		if (!name) throw new Error(`Character ${i + 1} name is required`);

		const traits = Array.isArray(r.traits)
			? (r.traits as unknown[])
					.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
					.map((t) => t.trim())
					.slice(0, 10)
			: [];

		const personality = typeof r.personality === 'string' ? r.personality.trim() : '';

		return { name, traits, personality };
	});

	// Beat count and total length — default sensible values for v1; expose later if needed.
	const beatCount =
		typeof b.beatCount === 'number' && b.beatCount >= 3 && b.beatCount <= 8
			? Math.round(b.beatCount)
			: 5;
	const totalLengthSeconds =
		typeof b.totalLengthSeconds === 'number' && b.totalLengthSeconds >= 15 && b.totalLengthSeconds <= 90
			? Math.round(b.totalLengthSeconds)
			: 30;

	try {
		return {
			ok: true,
			spec: {
				logline,
				tone,
				styleAnchor,
				sceneAnchor,
				arcTemplate,
				arcCustomDescription,
				payoff,
				characters,
			},
			beatCount,
			totalLengthSeconds,
		};
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Invalid characters' };
	}
}

export async function POST(request: NextRequest) {
	try {
		// Feature flag gate.
		if (!isAnimationModeEnabled()) {
			return NextResponse.json(
				{ error: 'Animation mode is not enabled' },
				{ status: 404 }
			);
		}

		// Auth required (animation is premium-only in v1, no anonymous trial).
		const user = await getAuthenticatedUser(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// CSRF.
		const csrfResult = validateCsrf(request);
		if (!csrfResult.isValid) {
			return NextResponse.json(
				{ error: csrfResult.error || 'CSRF validation failed' },
				{ status: 403 }
			);
		}

		// Validate wizard input.
		const body = await request.json();
		const validated = validateSpec(body);
		if (!validated.ok) {
			return NextResponse.json({ error: validated.error }, { status: 400 });
		}

		// Credit check.
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

		const hasCredits = await hasSufficientCreditsForAnimationStoryboard(supabase, user.id);
		if (!hasCredits) {
			return NextResponse.json(
				{
					error: 'Insufficient credits',
					message: `Animation storyboards cost ${ANIMATION_STORYBOARD_BASE_COST} credits base (plus per-image). Please upgrade your plan.`,
				},
				{ status: 403 }
			);
		}

		// Create job row with kind='animation' + animation_spec.
		const { data: job, error: jobError } = await supabase
			.from('analysis_jobs')
			.insert({
				user_id: user.id,
				video_url: null, // animation jobs have no source video
				kind: 'animation',
				animation_spec: {
					...validated.spec,
					beatCount: validated.beatCount,
					totalLengthSeconds: validated.totalLengthSeconds,
				},
				status: 'pending',
				current_step: 0,
				total_steps: 4,
			})
			.select()
			.single();

		if (jobError || !job) {
			console.error('[Animation Job Create] Insert failed:', jobError);
			return NextResponse.json(
				{ error: `Failed to create job: ${jobError?.message ?? 'unknown'}` },
				{ status: 500 }
			);
		}

		// Charge base cost. On failure, mark the job failed so the user can see it.
		const { error: chargeError } = await chargeAnimationStoryboardBase(supabase, user.id);
		if (chargeError) {
			console.error('[Animation Job Create] Charge failed:', chargeError);
			await supabase
				.from('analysis_jobs')
				.update({ status: 'failed', error_message: 'Failed to charge base cost' })
				.eq('id', job.id);
			return NextResponse.json(
				{ error: 'Failed to process credits. Please try again.' },
				{ status: 402 }
			);
		}

		console.log(
			`[Animation Job Create] ID: ${job.id} user=${user.id} beats=${validated.beatCount} length=${validated.totalLengthSeconds}s`
		);

		return NextResponse.json(
			{
				job_id: job.id,
				status: job.status,
				current_step: job.current_step,
				total_steps: job.total_steps,
				created_at: job.created_at,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('[Animation Job Create] API error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
}
