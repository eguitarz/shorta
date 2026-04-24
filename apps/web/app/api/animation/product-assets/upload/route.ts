/**
 * POST /api/animation/product-assets/upload
 *
 * Multipart upload for Product Demo mode screenshots. Accepts 1-4 images,
 * each up to 4MB, PNG/JPEG/WebP. Writes to the private product-assets bucket
 * under `{user_id}/drafts/{draft_id}/...` and returns the paths.
 *
 * The client holds the returned paths in wizard state and submits them with
 * the create-job request. The create endpoint validates each path exists
 * before inserting the job.
 *
 * Security:
 *   - Auth required (premium-only in v1 like animation mode)
 *   - CSRF validated
 *   - MIME type whitelist (server-enforced, not trusted from client)
 *   - Size cap (server-enforced)
 *   - Count cap (1-4 files)
 *   - Rate-limited by user
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAnimationProductModeEnabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILES = 4;
const MAX_BYTES_PER_FILE = 4 * 1024 * 1024; // 4MB
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

/** Draft id: short random, collision-resistant for a single user's drafts. */
function draftId(): string {
	const bytes = new Uint8Array(12);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function POST(request: NextRequest) {
	try {
		if (!isAnimationProductModeEnabled()) {
			return NextResponse.json(
				{ error: 'Product demo mode is not enabled' },
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
		const files = formData.getAll('files').filter((f): f is File => f instanceof File);

		if (files.length === 0) {
			return NextResponse.json({ error: 'No files provided' }, { status: 400 });
		}
		if (files.length > MAX_FILES) {
			return NextResponse.json(
				{ error: `At most ${MAX_FILES} files allowed` },
				{ status: 413 }
			);
		}

		for (const f of files) {
			if (!ALLOWED_MIME.has(f.type)) {
				return NextResponse.json(
					{ error: `Unsupported image type: ${f.type || 'unknown'}` },
					{ status: 415 }
				);
			}
			if (f.size > MAX_BYTES_PER_FILE) {
				return NextResponse.json(
					{ error: `Image too large (>4MB): ${f.name}` },
					{ status: 413 }
				);
			}
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
		const uploadedPaths: string[] = [];

		for (let i = 0; i < files.length; i++) {
			const f = files[i];
			const ext = mimeToExt(f.type);
			const path = `${user.id}/drafts/${draft}/${i}.${ext}`;
			const arrayBuf = await f.arrayBuffer();
			const { error } = await supabase.storage
				.from('product-assets')
				.upload(path, arrayBuf, {
					contentType: f.type,
					upsert: false,
				});
			if (error) {
				// Best-effort rollback of prior uploads in this batch.
				for (const p of uploadedPaths) {
					await supabase.storage.from('product-assets').remove([p]);
				}
				return NextResponse.json(
					{ error: `Upload failed: ${error.message}` },
					{ status: 500 }
				);
			}
			uploadedPaths.push(path);
		}

		return NextResponse.json(
			{ paths: uploadedPaths, draft_id: draft },
			{ status: 201 }
		);
	} catch (err) {
		console.error('[product-assets/upload] error:', err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Internal error' },
			{ status: 500 }
		);
	}
}
