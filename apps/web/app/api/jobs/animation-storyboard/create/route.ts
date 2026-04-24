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
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
	hasSufficientCreditsForAnimationStoryboard,
	chargeAnimationStoryboardBase,
	ANIMATION_STORYBOARD_BASE_COST,
} from '@/lib/storyboard-usage';
import {
	isAnimationModeEnabled,
	isAnimationProductModeEnabled,
} from '@/lib/feature-flags';
import type {
	AnimationWizardSpec,
	ArcTemplateId,
	ProductContext,
} from '@/lib/types/beat';

export const dynamic = 'force-dynamic';

const VALID_ARC_TEMPLATES: readonly ArcTemplateId[] = [
	'setup_twist_payoff',
	'problem_escalation_resolution',
	'loop',
	'reveal',
	'reversal',
	'chase_build',
	'product_demo',
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

	// Parse productContext (optional). Presence triggers the product_demo pipeline
	// and relaxes several story-mode required fields (logline/payoff are synthesized).
	let productContext: ProductContext | undefined;
	if (b.productContext && typeof b.productContext === 'object') {
		if (!isAnimationProductModeEnabled()) {
			return { ok: false, error: 'Product demo mode is not enabled' };
		}
		const pc = b.productContext as Record<string, unknown>;
		const mode = pc.mode === 'url' || pc.mode === 'upload' ? pc.mode : null;
		if (!mode) return { ok: false, error: 'productContext.mode must be "url" or "upload"' };

		const sourceUrl =
			typeof pc.sourceUrl === 'string' && pc.sourceUrl.trim() ? pc.sourceUrl.trim() : undefined;
		const productName =
			typeof pc.productName === 'string' ? pc.productName.trim().slice(0, 200) : '';
		if (!productName) return { ok: false, error: 'Product name is required' };
		const headline = typeof pc.headline === 'string' ? pc.headline.trim().slice(0, 200) : '';
		if (!headline) return { ok: false, error: 'Headline is required' };
		const subhead =
			typeof pc.subhead === 'string' && pc.subhead.trim()
				? pc.subhead.trim().slice(0, 280)
				: undefined;
		const ctaText = typeof pc.ctaText === 'string' ? pc.ctaText.trim().slice(0, 80) : '';
		if (!ctaText) return { ok: false, error: 'CTA text is required' };

		const assetPaths = Array.isArray(pc.assetPaths)
			? (pc.assetPaths as unknown[])
					.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
					.map((p) => p.trim())
					.slice(0, 4)
			: [];
		if (assetPaths.length === 0) {
			return { ok: false, error: 'At least one product asset is required' };
		}
		const heroAssetPath =
			typeof pc.heroAssetPath === 'string' && pc.heroAssetPath.trim()
				? pc.heroAssetPath.trim()
				: assetPaths[0];
		if (!assetPaths.includes(heroAssetPath)) {
			return { ok: false, error: 'heroAssetPath must be in assetPaths' };
		}

		// Brief is opaque to validation — it's produced by our own summarizer
		// endpoint, so we don't second-guess its shape. Just clamp string sizes
		// defensively if the client ever rebuilds it.
		const briefRaw = pc.brief as Record<string, unknown> | undefined;
		const brief = briefRaw && typeof briefRaw === 'object' ? briefRaw : undefined;

		productContext = {
			mode,
			sourceUrl,
			productName,
			headline,
			subhead,
			ctaText,
			assetPaths,
			heroAssetPath,
			scrapePartial: pc.scrapePartial === true,
			brief: brief as ProductContext['brief'],
		};
	}

	// Required wizard fields. In product-demo mode, logline + payoff are
	// synthesized from productContext if missing.
	let logline = typeof b.logline === 'string' ? b.logline.trim() : '';
	if (!logline && productContext) {
		logline = `Product demo for ${productContext.productName}: ${productContext.headline}`;
	}
	if (logline.length < 10) return { ok: false, error: 'Logline must be at least 10 characters' };
	if (logline.length > 500) return { ok: false, error: 'Logline must be 500 characters or fewer' };

	const tone = typeof b.tone === 'string' ? b.tone.trim() : '';
	if (!tone) return { ok: false, error: 'Tone is required' };

	let styleAnchor = typeof b.styleAnchor === 'string' ? b.styleAnchor.trim() : '';
	if (!styleAnchor && productContext) {
		styleAnchor = 'Clean SaaS marketing, modern, confident';
	}
	if (!styleAnchor) return { ok: false, error: 'Visual style is required' };

	let sceneAnchor = typeof b.sceneAnchor === 'string' ? b.sceneAnchor.trim() : '';
	if (!sceneAnchor && productContext) {
		sceneAnchor = `The ${productContext.productName} product interface`;
	}
	if (!sceneAnchor) return { ok: false, error: 'Setting is required' };

	// Arc: product demo forces product_demo; story mode validates whitelist.
	let arcTemplate = typeof b.arcTemplate === 'string' ? (b.arcTemplate as ArcTemplateId) : 'setup_twist_payoff';
	if (productContext) arcTemplate = 'product_demo';
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

	// Payoff: in product-demo mode, we use ctaText as the payoff.
	const payoff = productContext
		? productContext.ctaText
		: typeof b.payoff === 'string'
			? b.payoff.trim()
			: '';
	if (payoff.length < 5) return { ok: false, error: 'Payoff must be at least 5 characters' };

	// Character rules depend on mode. Product demo allows 0-2 characters
	// (mascot + narrator). Story mode requires 1-2.
	const rawCharacters = Array.isArray(b.characters) ? b.characters : [];
	const minChars = productContext ? 0 : 1;
	const maxChars = 2;
	if (rawCharacters.length < minChars) {
		return { ok: false, error: 'At least one character is required' };
	}
	if (rawCharacters.length > maxChars) {
		return { ok: false, error: 'v1 supports 1-2 characters only' };
	}

	const characters = rawCharacters.map((raw, i) => {
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

		// Pre-pinned character sheet (e.g. reused from the product landing
		// page). Must be in the caller's own folder in character-sheets.
		// Deep existence check happens post-validation in verifyCharacterSheets.
		const sheetStoragePath =
			typeof r.sheetStoragePath === 'string' && r.sheetStoragePath.trim()
				? r.sheetStoragePath.trim()
				: undefined;

		return { name, traits, personality, sheetStoragePath };
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
				productContext,
			},
			beatCount,
			totalLengthSeconds,
		};
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Invalid characters' };
	}
}

/**
 * Verify each pre-pinned character sheet path exists in the character-sheets
 * bucket and is owned by the user. Same defense-in-depth pattern as
 * verifyProductAssets.
 */
async function verifyCharacterSheets(
	supabase: SupabaseClient,
	userId: string,
	characters: Array<{ sheetStoragePath?: string }>
): Promise<string | null> {
	for (const c of characters) {
		const path = c.sheetStoragePath;
		if (!path) continue;
		if (!path.startsWith(`${userId}/`)) {
			return `Character sheet path not owned by user: ${path}`;
		}
		const lastSlash = path.lastIndexOf('/');
		const folder = path.slice(0, lastSlash);
		const filename = path.slice(lastSlash + 1);
		const { data, error } = await supabase.storage
			.from('character-sheets')
			.list(folder, { limit: 20, search: filename });
		if (error) return `Failed to verify character sheet: ${error.message}`;
		if (!data?.some((obj) => obj.name === filename)) {
			return `Character sheet not found: ${path}`;
		}
	}
	return null;
}

/**
 * Verify each productContext asset path exists in the product-assets bucket
 * and is owned by the user (RLS prefix check). Prevents path-spoof jobs that
 * would fail later in the pipeline.
 */
async function verifyProductAssets(
	supabase: SupabaseClient,
	userId: string,
	productContext: ProductContext
): Promise<string | null> {
	for (const path of productContext.assetPaths) {
		// Paths must start with {user_id}/ (defense in depth: RLS already scopes,
		// but reject obviously spoofed paths before doing the round-trip).
		if (!path.startsWith(`${userId}/`)) {
			return `Asset path not owned by user: ${path}`;
		}
		// Cheap existence check via list on the parent folder.
		const lastSlash = path.lastIndexOf('/');
		const folder = path.slice(0, lastSlash);
		const filename = path.slice(lastSlash + 1);
		const { data, error } = await supabase.storage
			.from('product-assets')
			.list(folder, { limit: 20, search: filename });
		if (error) {
			return `Failed to verify asset: ${error.message}`;
		}
		if (!data?.some((obj) => obj.name === filename)) {
			return `Asset not found: ${path}`;
		}
	}
	return null;
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

		// Verify uploaded product assets exist in the bucket (prevents
		// path-spoof and races with the upload endpoint).
		if (validated.spec.productContext) {
			const assetError = await verifyProductAssets(
				supabase,
				user.id,
				validated.spec.productContext
			);
			if (assetError) {
				return NextResponse.json({ error: assetError }, { status: 400 });
			}
		}

		// Verify any pre-pinned character sheets (reused from product landing page).
		const sheetError = await verifyCharacterSheets(
			supabase,
			user.id,
			validated.spec.characters
		);
		if (sheetError) {
			return NextResponse.json({ error: sheetError }, { status: 400 });
		}

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
