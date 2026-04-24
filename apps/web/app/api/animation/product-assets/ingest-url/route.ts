/**
 * POST /api/animation/product-assets/ingest-url
 *
 * Given a user-pasted URL, scrape product metadata (productName, headline,
 * subhead, og:image), download the hero image into the private
 * product-assets bucket, and return the auto-fill payload + hero asset path.
 *
 * Security guards (SSRF, timeout, size caps) live in lib/product/ingest-url.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { rateLimitByUser, RateLimits } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAnimationProductModeEnabled } from '@/lib/feature-flags';
import {
	ingestProductUrl,
	downloadHeroImage,
	IngestUrlError,
} from '@/lib/product/ingest-url';
import { summarizeProductPage } from '@/lib/product/summarize-page';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function draftId(): string {
	const bytes = new Uint8Array(12);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function mimeToExt(mime: string): string {
	switch (mime) {
		case 'image/png':
			return 'png';
		case 'image/jpeg':
		case 'image/jpg':
			return 'jpg';
		case 'image/webp':
			return 'webp';
		default:
			return 'png';
	}
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

		const body = await request.json();
		const url = typeof body?.url === 'string' ? body.url : '';

		const scraped = await ingestProductUrl(url);

		// Attempt hero image download + upload. If this step fails, we still
		// return the text metadata — the user can upload a screenshot instead.
		let heroAssetPath: string | undefined;
		let heroSignedUrl: string | undefined;
		let heroDownloadError: string | undefined;
		let heroImageBytes:
			| { mimeType: string; data: string }
			| undefined;
		if (scraped.heroImageUrl) {
			try {
				const { bytes, mimeType } = await downloadHeroImage(scraped.heroImageUrl);
				// Keep the base64-encoded bytes around to hand to the summarizer
				// — avoids a second fetch of the same image.
				heroImageBytes = {
					mimeType,
					data: Buffer.from(bytes).toString('base64'),
				};
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
				const ext = mimeToExt(mimeType);
				const path = `${user.id}/drafts/${draft}/hero.${ext}`;
				const { error } = await supabase.storage
					.from('product-assets')
					.upload(path, bytes, { contentType: mimeType, upsert: false });
				if (error) {
					heroDownloadError = `Hero upload failed: ${error.message}`;
				} else {
					heroAssetPath = path;
					// Signed URL for the wizard preview. 1h TTL — wizard sessions
					// typically last a few minutes, plenty of headroom.
					const { data: signed } = await supabase.storage
						.from('product-assets')
						.createSignedUrl(path, 60 * 60);
					heroSignedUrl = signed?.signedUrl;
				}
			} catch (err) {
				heroDownloadError = err instanceof Error ? err.message : 'Hero download failed';
			}
		}

		// Run the Jina+Gemini summarizer in parallel-spirit (fires after hero
		// download; hero is cheap and OG metadata helps us guide the summary).
		// Fire-and-forget on failure — brief is a nice-to-have, never a hard dep.
		const summary = await summarizeProductPage({
			url: scraped.sourceUrl,
			fallbackProductName: scraped.productName,
			fallbackHeadline: scraped.headline,
			fallbackSubhead: scraped.subhead,
			heroImageUrl: scraped.heroImageUrl,
			heroImageBytes,
			fallbackHtml: scraped.rawHtml,
			env: {
				GEMINI_API_KEY: process.env.GEMINI_API_KEY,
				LLM_MODEL: process.env.LLM_MODEL,
			},
			locale: typeof body?.locale === 'string' ? body.locale : undefined,
		});

		const briefBase = summary.ok ? summary.brief : undefined;
		const briefError = summary.ok ? undefined : summary.reason;
		const attachedImages = summary.ok ? summary.attachedImages : [];

		// Upload any Gemini-suggested characters into the character-sheets
		// bucket so Pass 3 can skip generation and pin the actual landing-page
		// avatar. Best-effort: failures just drop the suggestion silently.
		const resolvedSuggestions: NonNullable<typeof briefBase>['suggestedCharacters'] = [];
		if (briefBase?.suggestedCharacters?.length && attachedImages.length) {
			const cookieStore2 = await cookies();
			const supabase2 = createServerClient(
				process.env.NEXT_PUBLIC_SUPABASE_URL!,
				process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
				{
					cookies: {
						getAll() {
							return cookieStore2.getAll();
						},
						setAll(cookiesToSet) {
							try {
								cookiesToSet.forEach(({ name, value, options }) =>
									cookieStore2.set(name, value, options)
								);
							} catch {
								// ignore
							}
						},
					},
				}
			);

			for (let i = 0; i < briefBase.suggestedCharacters.length; i++) {
				const c = briefBase.suggestedCharacters[i];
				const m = /^__pending_index_(\d+)__$/.exec(c.sheetStoragePath);
				if (!m) continue;
				const idx = Number(m[1]);
				const img = attachedImages.find((a) => a.geminiIndex === idx);
				if (!img) continue;
				try {
					const draft = draftId();
					const ext = mimeToExt(img.mimeType);
					const path = `${user.id}/drafts/${draft}/suggested_char_${i}.${ext}`;
					const bytes = Buffer.from(img.data, 'base64');
					const { error } = await supabase2.storage
						.from('character-sheets')
						.upload(path, bytes, { contentType: img.mimeType, upsert: false });
					if (error) continue;
					const { data: signed } = await supabase2.storage
						.from('character-sheets')
						.createSignedUrl(path, 60 * 60);
					resolvedSuggestions.push({
						name: c.name,
						traits: c.traits,
						personality: c.personality,
						sheetStoragePath: path,
						sheetSignedUrl: signed?.signedUrl,
					});
				} catch {
					// swallow — optional enrichment
				}
			}
		}

		const brief = briefBase
			? {
					...briefBase,
					suggestedCharacters: resolvedSuggestions.length
						? resolvedSuggestions
						: undefined,
				}
			: undefined;

		// If Gemini produced a richer brief, prefer its oneLiner as the headline
		// (falls back to OG headline if Gemini skipped it).
		const effectiveHeadline = brief?.oneLiner || scraped.headline;

		return NextResponse.json(
			{
				sourceUrl: scraped.sourceUrl,
				productName: scraped.productName,
				headline: effectiveHeadline,
				subhead: scraped.subhead,
				heroAssetPath,
				heroSignedUrl,
				heroDownloadError,
				brief,
				briefError,
				partial: scraped.partial || !heroAssetPath,
			},
			{ status: 200 }
		);
	} catch (err) {
		if (err instanceof IngestUrlError) {
			const status =
				err.code === 'invalid_url' ||
				err.code === 'not_https' ||
				err.code === 'private_ip'
					? 400
					: err.code === 'timeout'
						? 504
						: err.code === 'too_large'
							? 413
							: err.code === 'http_error'
								? 502
								: err.code === 'bot_blocked'
									? 503
									: 500;
			return NextResponse.json({ error: err.message, code: err.code }, { status });
		}
		console.error('[product-assets/ingest-url] error:', err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Internal error' },
			{ status: 500 }
		);
	}
}
