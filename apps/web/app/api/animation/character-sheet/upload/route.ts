/**
 * POST /api/animation/character-sheet/upload
 *
 * Upload a photo of a real person (talent / creator / brand ambassador) to
 * use as a character sheet. Bypasses Pass 3's AI sheet generation — the
 * uploaded photo becomes the identity lock pinned on every beat where
 * that character appears.
 *
 * Used by the Characters step's "Upload talent photo" button for photoreal
 * cosmetic / creator / commercial promos. Same bucket / path convention as
 * the suggested-character flow so the existing cleanup trigger catches it.
 *
 * Body: multipart/form-data with `file` field (single image).
 * Response: { path: string, signedUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAnimationModeEnabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

function mimeToExt(mime: string): string {
	switch (mime) {
		case 'image/png':
			return 'png';
		case 'image/jpeg':
			return 'jpg';
		case 'image/webp':
			return 'webp';
		default:
			return 'bin';
	}
}

function draftId(): string {
	const bytes = new Uint8Array(12);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function POST(request: NextRequest) {
	try {
		if (!isAnimationModeEnabled()) {
			return NextResponse.json(
				{ error: 'Animation mode is not enabled' },
				{ status: 404 }
			);
		}

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

		const formData = await request.formData();
		const file = formData.get('file');
		if (!(file instanceof File)) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}
		if (!ALLOWED_MIME.has(file.type)) {
			return NextResponse.json(
				{ error: `Unsupported image type: ${file.type || 'unknown'}` },
				{ status: 415 }
			);
		}
		if (file.size > MAX_BYTES) {
			return NextResponse.json(
				{ error: 'Image too large (> 4MB)' },
				{ status: 413 }
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

		const draft = draftId();
		const ext = mimeToExt(file.type);
		const path = `${user.id}/drafts/${draft}/talent.${ext}`;
		const arrayBuf = await file.arrayBuffer();
		const { error: uploadError } = await supabase.storage
			.from('character-sheets')
			.upload(path, arrayBuf, { contentType: file.type, upsert: false });
		if (uploadError) {
			return NextResponse.json(
				{ error: `Upload failed: ${uploadError.message}` },
				{ status: 500 }
			);
		}

		// Signed URL for wizard preview (1h TTL).
		const { data: signed } = await supabase.storage
			.from('character-sheets')
			.createSignedUrl(path, 60 * 60);

		return NextResponse.json(
			{ path, signedUrl: signed?.signedUrl },
			{ status: 201 }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[character-sheet/upload] error:', message);
		return NextResponse.json(
			{ error: 'Upload failed', message },
			{ status: 500 }
		);
	}
}
