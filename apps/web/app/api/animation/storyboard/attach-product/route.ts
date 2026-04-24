/**
 * POST /api/animation/storyboard/attach-product
 *
 * Attach (or replace) a product on an existing animation storyboard. Used
 * when the user lands on a storyboard without productContext — either
 * because it was generated in Story mode, or because an old product-demo
 * storyboard lost its productContext before we started persisting it
 * properly into animation_meta.
 *
 * After this call, the "Use product image" toggle activates on every beat
 * that makes sense for it, and the product hero becomes available as a
 * reference for Pass 4 image generation.
 *
 * Body: {
 *   storyboardId: string,
 *   productName: string,
 *   heroAssetPath: string,     // from /api/animation/product-assets/upload
 *   assetPaths?: string[],     // defaults to [heroAssetPath]
 *   subhead?: string,
 *   ctaText?: string,          // defaults to "Try it free"
 *   sourceUrl?: string,
 *   mode?: 'url' | 'upload',   // defaults to 'upload'
 * }
 * Response: { productContext: ProductContext }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AnimationMeta, ProductContext } from '@/lib/types/beat';

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
		const productName =
			typeof body?.productName === 'string' ? body.productName.trim().slice(0, 120) : '';
		const heroAssetPath =
			typeof body?.heroAssetPath === 'string' ? body.heroAssetPath.trim() : '';
		if (!storyboardId || !productName || !heroAssetPath) {
			return NextResponse.json(
				{ error: 'storyboardId, productName, and heroAssetPath are required' },
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
			.select('id, user_id, animation_meta')
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

		// Verify the asset path belongs to the user AND exists. Same defense
		// as the job-create route — prevents cross-user path-spoof.
		if (!heroAssetPath.startsWith(`${user.id}/`)) {
			return NextResponse.json(
				{ error: 'Asset path not owned by user' },
				{ status: 400 }
			);
		}
		const lastSlash = heroAssetPath.lastIndexOf('/');
		const folder = heroAssetPath.slice(0, lastSlash);
		const filename = heroAssetPath.slice(lastSlash + 1);
		const { data: listing, error: listErr } = await supabase.storage
			.from('product-assets')
			.list(folder, { limit: 20, search: filename });
		if (listErr) {
			return NextResponse.json(
				{ error: `Failed to verify asset: ${listErr.message}` },
				{ status: 500 }
			);
		}
		if (!listing?.some((obj) => obj.name === filename)) {
			return NextResponse.json(
				{ error: `Asset not found: ${heroAssetPath}` },
				{ status: 404 }
			);
		}

		const rawAssetPaths = Array.isArray(body?.assetPaths)
			? (body.assetPaths as unknown[])
					.filter((p): p is string => typeof p === 'string' && !!p.trim())
					.map((p) => p.trim())
			: [];
		const assetPaths = rawAssetPaths.length ? rawAssetPaths : [heroAssetPath];
		if (!assetPaths.includes(heroAssetPath)) {
			assetPaths.unshift(heroAssetPath);
		}

		// Preserve any existing productContext fields (e.g. product name or
		// CTA the user set via the wizard) unless overridden in this request.
		const meta = sb.animation_meta as AnimationMeta;
		const existing = meta.productContext;
		const productContext: ProductContext = {
			mode: (body?.mode === 'url' ? 'url' : 'upload'),
			sourceUrl:
				typeof body?.sourceUrl === 'string' && body.sourceUrl.trim()
					? body.sourceUrl.trim()
					: existing?.sourceUrl,
			productName,
			headline:
				typeof body?.headline === 'string' && body.headline.trim()
					? body.headline.trim().slice(0, 200)
					: existing?.headline || productName,
			subhead:
				typeof body?.subhead === 'string' && body.subhead.trim()
					? body.subhead.trim().slice(0, 280)
					: existing?.subhead,
			ctaText:
				typeof body?.ctaText === 'string' && body.ctaText.trim()
					? body.ctaText.trim().slice(0, 80)
					: existing?.ctaText || 'Try it free',
			assetPaths,
			heroAssetPath,
		};

		const { error: rpcError } = await supabase.rpc('update_animation_meta', {
			p_storyboard_id: storyboardId,
			p_patch: { productContext },
		});
		if (rpcError) {
			return NextResponse.json(
				{ error: `Failed to attach product: ${rpcError.message}` },
				{ status: 500 }
			);
		}

		// Return a signed URL for the wizard preview (1h TTL).
		const { data: signed } = await supabase.storage
			.from('product-assets')
			.createSignedUrl(heroAssetPath, 60 * 60);

		return NextResponse.json(
			{
				productContext,
				heroSignedUrl: signed?.signedUrl,
			},
			{ status: 200 }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/storyboard/attach-product] error:', message);
		return NextResponse.json(
			{ error: 'Attach failed', message },
			{ status: 500 }
		);
	}
}
