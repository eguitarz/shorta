/**
 * POST /api/animation/character/update
 *
 * Update one character in a storyboard's animation_meta. Used by the
 * /storyboard/generate/[id] page to let the user swap the talent photo,
 * rename the character, or edit traits/personality without redoing the
 * whole wizard flow.
 *
 * Persists the updated characters array via the update_animation_meta RPC.
 * Does NOT touch beats or beat_images — the caller is responsible for
 * clearing beat_images + re-running image gen if they want visuals to
 * reflect the change.
 *
 * Body: {
 *   storyboardId: string,
 *   characterId: string,   // e.g. "char_1"
 *   name?: string,
 *   traits?: string[],
 *   personality?: string,
 *   sheetStoragePath?: string,  // new talent photo path (from upload route)
 * }
 * Response: { characters: AnimationCharacter[] (with signed URLs) }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AnimationCharacter, AnimationMeta } from '@/lib/types/beat';

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
		const characterId = typeof body?.characterId === 'string' ? body.characterId : '';
		if (!storyboardId || !characterId) {
			return NextResponse.json(
				{ error: 'storyboardId and characterId are required' },
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
			return NextResponse.json(
				{ error: 'Not an animation storyboard' },
				{ status: 400 }
			);
		}

		const meta = sb.animation_meta as AnimationMeta;
		const idx = meta.characters.findIndex((c) => c.id === characterId);
		if (idx < 0) {
			return NextResponse.json(
				{ error: `Character '${characterId}' not found in this storyboard` },
				{ status: 404 }
			);
		}

		// Merge field updates. Unspecified fields are preserved.
		const current = meta.characters[idx];
		const next: AnimationCharacter = { ...current };

		if (typeof body.name === 'string' && body.name.trim()) {
			next.name = body.name.trim().slice(0, 120);
		}
		if (typeof body.personality === 'string') {
			next.personality = body.personality.trim().slice(0, 400);
		}
		if (Array.isArray(body.traits)) {
			next.traits = (body.traits as unknown[])
				.filter((t): t is string => typeof t === 'string' && !!t.trim())
				.map((t) => t.trim().slice(0, 60))
				.slice(0, 10);
		}

		// New talent photo: verify it exists in character-sheets bucket AND
		// starts with the user's own prefix before committing. Same defense-
		// in-depth pattern as the create route.
		if (typeof body.sheetStoragePath === 'string' && body.sheetStoragePath.trim()) {
			const path = body.sheetStoragePath.trim();
			if (!path.startsWith(`${user.id}/`)) {
				return NextResponse.json(
					{ error: 'Character sheet path not owned by user' },
					{ status: 400 }
				);
			}
			const lastSlash = path.lastIndexOf('/');
			const folder = path.slice(0, lastSlash);
			const filename = path.slice(lastSlash + 1);
			const { data: listing, error: listErr } = await supabase.storage
				.from('character-sheets')
				.list(folder, { limit: 20, search: filename });
			if (listErr) {
				return NextResponse.json(
					{ error: `Failed to verify talent photo: ${listErr.message}` },
					{ status: 500 }
				);
			}
			if (!listing?.some((obj) => obj.name === filename)) {
				return NextResponse.json(
					{ error: `Talent photo not found: ${path}` },
					{ status: 404 }
				);
			}
			next.sheetStoragePath = path;
			next.sheetGeneratedAt = new Date().toISOString();
			next.sheetFailureReason = undefined;
		}

		const newCharacters = [...meta.characters];
		newCharacters[idx] = next;

		// Atomic JSONB merge at the top level of animation_meta.
		const { error: rpcError } = await supabase.rpc('update_animation_meta', {
			p_storyboard_id: storyboardId,
			p_patch: { characters: newCharacters },
		});
		if (rpcError) {
			return NextResponse.json(
				{ error: `Failed to update character: ${rpcError.message}` },
				{ status: 500 }
			);
		}

		// Return characters with signed URLs so the client can refresh the
		// thumbnail without a separate round-trip.
		const charactersWithUrls = await Promise.all(
			newCharacters.map(async (c) => {
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

		return NextResponse.json(
			{ characters: charactersWithUrls },
			{ status: 200 }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/character/update] error:', message);
		return NextResponse.json(
			{ error: 'Update failed', message },
			{ status: 500 }
		);
	}
}
