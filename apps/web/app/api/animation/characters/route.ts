/**
 * GET /api/animation/characters?storyboardId=...
 *
 * Returns the storyboard's characters with freshly-minted signed URLs for
 * their sheet images (the sheets live in the private `character-sheets`
 * bucket). Used by the /storyboard/generate/[id] page to render the
 * Characters section so users can see and edit them.
 *
 * Signed URL TTL: 1 hour. Plenty for a session; short enough that it's not
 * worth persisting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AnimationCharacter, AnimationMeta } from '@/lib/types/beat';

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
		if (!sb.animation_meta) {
			return NextResponse.json({ characters: [] }, { status: 200 });
		}

		const meta = sb.animation_meta as AnimationMeta;
		const characters = await Promise.all(
			(meta.characters ?? []).map(async (c) => {
				let sheetSignedUrl: string | undefined;
				if (c.sheetStoragePath) {
					const { data: signed } = await supabase.storage
						.from('character-sheets')
						.createSignedUrl(c.sheetStoragePath, 60 * 60);
					sheetSignedUrl = signed?.signedUrl;
				}
				return { ...c, sheetSignedUrl } as AnimationCharacter;
			})
		);

		return NextResponse.json({ characters }, { status: 200 });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/characters] error:', message);
		return NextResponse.json(
			{ error: 'Failed to load characters', message },
			{ status: 500 }
		);
	}
}
