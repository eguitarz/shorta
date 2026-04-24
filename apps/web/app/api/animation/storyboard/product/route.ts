/**
 * GET /api/animation/storyboard/product?storyboardId=...
 *
 * Returns the storyboard's productContext with a fresh signed preview URL
 * for the hero asset (the asset lives in the private `product-assets`
 * bucket). Used by the Product panel on /storyboard/generate/[id] to
 * render the current product thumbnail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AnimationMeta } from '@/lib/types/beat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
	try {
		const user = await getAuthenticatedUser(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const storyboardId = new URL(request.url).searchParams.get('storyboardId');
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

		const { data: sb, error } = await supabase
			.from('generated_storyboards')
			.select('id, user_id, animation_meta')
			.eq('id', storyboardId)
			.single();
		if (error || !sb) {
			return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 });
		}
		if (sb.user_id !== user.id) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const meta = sb.animation_meta as AnimationMeta | null;
		const pc = meta?.productContext ?? null;
		let heroSignedUrl: string | undefined;
		if (pc?.heroAssetPath) {
			const { data: signed } = await supabase.storage
				.from('product-assets')
				.createSignedUrl(pc.heroAssetPath, 60 * 60);
			heroSignedUrl = signed?.signedUrl;
		}

		return NextResponse.json(
			{ productContext: pc, heroSignedUrl },
			{ status: 200 }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/storyboard/product] error:', message);
		return NextResponse.json(
			{ error: 'Failed to load product', message },
			{ status: 500 }
		);
	}
}
