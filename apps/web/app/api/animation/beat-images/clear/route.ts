/**
 * POST /api/animation/beat-images/clear
 *
 * Wipes beat_images on a storyboard so the next call to
 * /api/animation/beat-images/generate will regenerate every beat from scratch.
 * Used when the user edits a character (swaps the talent photo, etc.) and
 * wants the existing beat images to reflect the new identity.
 *
 * Beats themselves (script, visual, audio, characterAction) are preserved —
 * only the image data is cleared. That's the "same script, new model"
 * flow the user wants.
 *
 * Body: { storyboardId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

		// Ownership check before clearing. RLS would also block cross-user
		// updates, but we want a clean 403 instead of a silent no-op.
		const { data: sb, error: sbErr } = await supabase
			.from('generated_storyboards')
			.select('id, user_id')
			.eq('id', storyboardId)
			.single();
		if (sbErr || !sb) {
			return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 });
		}
		if (sb.user_id !== user.id) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { error: updateErr } = await supabase
			.from('generated_storyboards')
			.update({ beat_images: {} })
			.eq('id', storyboardId);
		if (updateErr) {
			return NextResponse.json(
				{ error: `Failed to clear: ${updateErr.message}` },
				{ status: 500 }
			);
		}

		// Also reset the animation job's status to beats_complete so any
		// future polling will re-trigger image generation. If the job is
		// already terminal (completed/capped/stale), this bumps it back.
		await supabase
			.from('analysis_jobs')
			.update({ status: 'beats_complete', updated_at: new Date().toISOString() })
			.eq('user_id', user.id)
			.eq('kind', 'animation')
			.filter('storyboard_result->>storyboardId', 'eq', storyboardId);

		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[animation/beat-images/clear] error:', message);
		return NextResponse.json({ error: 'Clear failed', message }, { status: 500 });
	}
}
