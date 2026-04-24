/**
 * Product URL ingestion for the AI Animation Storyboard product_demo mode.
 *
 * Takes a user-pasted URL, fetches the page, and extracts product context
 * (product name, headline, subhead, hero image). Used by the wizard to
 * auto-fill the product step.
 *
 * Security (per /plan-eng-review decision 3):
 *   - https only (reject http:// and anything else)
 *   - Reject URLs whose host resolves to a private/loopback/link-local IP
 *   - 5s fetch timeout on every HTTP request
 *   - 2MB response cap on HTML
 *   - 4MB response cap on hero image download
 *
 * Cloudflare Workers note:
 *   The Worker runtime has `fetch` but no DNS lookup API. We guard SSRF at
 *   the URL level: block literal private-IP hostnames, block localhost
 *   variants, require https. This covers the common SSRF shapes on CF.
 *   For true belt-and-suspenders (CNAME → private IP), a paid HTTP proxy
 *   with egress filtering would be needed — deferred to a follow-up.
 */

export interface IngestUrlResult {
	sourceUrl: string;
	productName: string;
	headline: string;
	subhead?: string;
	/** Image URL pulled from og:image / twitter:image / link rel=image_src. */
	heroImageUrl?: string;
	/**
	 * Additional product gallery images (e.g. Amazon listings expose 6-9
	 * high-res product photos). UI can auto-populate the screenshot slots.
	 * Does not include the hero — hero is already in `heroImageUrl`.
	 */
	galleryImageUrls?: string[];
	/** Brand name when extractable (Amazon `#bylineInfo`, etc.). */
	brand?: string;
	/** Which extractor produced the result. Useful for debugging + telemetry. */
	source?: 'generic' | 'amazon';
	/**
	 * True when at least one expected field (productName, headline, or subhead)
	 * could not be extracted. UI shows a "partial" note.
	 */
	partial: boolean;
	/**
	 * Raw HTML body. Returned so callers (e.g. the summarizer) can fall back
	 * to stripping this to plain text when Jina Reader is unavailable.
	 * Not persisted anywhere.
	 */
	rawHtml?: string;
}

export class IngestUrlError extends Error {
	readonly code:
		| 'invalid_url'
		| 'not_https'
		| 'private_ip'
		| 'timeout'
		| 'too_large'
		| 'http_error'
		| 'no_content'
		| 'fetch_failed'
		| 'bot_blocked';
	constructor(code: IngestUrlError['code'], message: string) {
		super(message);
		this.code = code;
	}
}

const FETCH_TIMEOUT_MS = 5_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB

/**
 * Block hostnames that resolve (literally or by convention) to private space.
 * We deliberately do NOT try DNS resolution — CF Workers don't expose it —
 * so we rely on literal-match guards for common SSRF vectors.
 */
export function isBlockedHost(host: string): boolean {
	const h = host.toLowerCase().trim();
	if (!h) return true;
	if (h === 'localhost' || h === 'localhost.localdomain') return true;
	if (h === '0.0.0.0' || h === '0') return true;
	if (h === '[::1]' || h === '::1') return true;
	// Metadata services (AWS/GCP/Azure). Worthless on CF but costs nothing to block.
	if (h === '169.254.169.254' || h === 'metadata.google.internal') return true;

	// IPv4 literal
	const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
	if (v4) {
		const [a, b] = [Number(v4[1]), Number(v4[2])];
		if (a === 10) return true;
		if (a === 127) return true;
		if (a === 0) return true;
		if (a === 169 && b === 254) return true; // link-local
		if (a === 172 && b >= 16 && b <= 31) return true;
		if (a === 192 && b === 168) return true;
		if (a >= 224) return true; // multicast + reserved
	}

	// IPv6 private / loopback / unique-local / link-local
	if (h.startsWith('[') && h.endsWith(']')) {
		const inner = h.slice(1, -1);
		if (inner.startsWith('fc') || inner.startsWith('fd')) return true; // unique-local
		if (inner.startsWith('fe80')) return true; // link-local
	}

	return false;
}

export function parseAndValidateUrl(input: string): URL {
	const trimmed = input.trim();
	if (!trimmed) throw new IngestUrlError('invalid_url', 'URL is required');

	// Allow users to paste "tabnora.com" without scheme; normalize to https.
	const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

	let url: URL;
	try {
		url = new URL(withScheme);
	} catch {
		throw new IngestUrlError('invalid_url', "That doesn't look like a valid URL");
	}

	if (url.protocol !== 'https:') {
		throw new IngestUrlError('not_https', 'URL must use https');
	}
	if (isBlockedHost(url.hostname)) {
		throw new IngestUrlError('private_ip', 'Private addresses are not allowed');
	}

	return url;
}

/** Fetch with timeout + byte cap. Returns decoded text. */
async function fetchCapped(
	url: string,
	maxBytes: number,
	accept: string,
	extraHeaders?: Record<string, string>
): Promise<{ bytes: Uint8Array; contentType: string }> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			redirect: 'follow',
			headers: {
				'user-agent': 'Mozilla/5.0 (compatible; ShortaBot/1.0; +https://shorta.app)',
				accept,
				...extraHeaders,
			},
		});
		if (!res.ok) {
			throw new IngestUrlError(
				'http_error',
				`URL returned ${res.status} ${res.statusText || ''}`.trim()
			);
		}
		const contentType = res.headers.get('content-type') || '';
		const len = res.headers.get('content-length');
		if (len && Number(len) > maxBytes) {
			throw new IngestUrlError('too_large', 'Response is too large');
		}
		const reader = res.body?.getReader();
		if (!reader) {
			throw new IngestUrlError('no_content', 'URL returned empty body');
		}
		const chunks: Uint8Array[] = [];
		let total = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				total += value.byteLength;
				if (total > maxBytes) {
					try {
						await reader.cancel();
					} catch {
						// ignore
					}
					throw new IngestUrlError('too_large', 'Response exceeded size cap');
				}
				chunks.push(value);
			}
		}
		const merged = new Uint8Array(total);
		let offset = 0;
		for (const c of chunks) {
			merged.set(c, offset);
			offset += c.byteLength;
		}
		return { bytes: merged, contentType };
	} catch (err) {
		if (err instanceof IngestUrlError) throw err;
		if ((err as { name?: string })?.name === 'AbortError') {
			throw new IngestUrlError('timeout', 'Site took too long to respond');
		}
		throw new IngestUrlError('fetch_failed', "Couldn't reach that URL");
	} finally {
		clearTimeout(timer);
	}
}

/** Decode the fetched bytes as UTF-8 HTML. */
function decodeHtml(bytes: Uint8Array): string {
	return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

/**
 * Extract a single meta tag value by attribute lookup. Case-insensitive.
 * Handles both `name=` and `property=` variants AND correctly handles
 * apostrophes inside double-quoted content (e.g. `content="We'll remember"`).
 */
function extractMeta(html: string, keyValue: string): string | undefined {
	const pattern = new RegExp(
		`<meta[^>]+(?:property|name)=['"]${keyValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][^>]*>`,
		'i'
	);
	const tag = pattern.exec(html)?.[0];
	if (!tag) return undefined;
	// Backreference the opening quote — match until the SAME quote character.
	// Otherwise "We'll" inside content="..." terminates at the single quote.
	const content = /content=(['"])([\s\S]*?)\1/i.exec(tag)?.[2];
	if (!content) return undefined;
	// Decode common HTML entities.
	const decoded = content
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'");
	return decoded.trim() || undefined;
}

/** Extract the first matching tag's text content. Strips inner tags. */
function extractTagText(html: string, tag: string): string | undefined {
	const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
	const match = pattern.exec(html)?.[1];
	if (!match) return undefined;
	// Strip inner tags, collapse whitespace.
	const cleaned = match
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return cleaned || undefined;
}

/** Resolve an image URL (possibly relative) against the page's base URL. */
function resolveImageUrl(raw: string, base: URL): string | undefined {
	try {
		return new URL(raw, base).toString();
	} catch {
		return undefined;
	}
}

/**
 * Derive a product name from a hostname when no og:site_name is found.
 * `tabnora.com` → `Tabnora`, `app.linear.app` → `Linear`.
 */
function productNameFromHost(hostname: string): string {
	const parts = hostname.toLowerCase().split('.').filter(Boolean);
	if (parts.length === 0) return hostname;
	// Drop subdomains that look like app / www / admin / staging
	const commonSub = new Set(['www', 'app', 'admin', 'staging', 'api', 'docs']);
	let host = parts;
	while (host.length > 2 && commonSub.has(host[0])) host = host.slice(1);
	const base = host.length >= 2 ? host[host.length - 2] : host[0];
	if (!base) return hostname;
	return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Ingest a product URL: fetch, parse metadata, return structured context.
 * Throws IngestUrlError on any rejected URL or fetch failure.
 *
 * Site-specific extractors take priority over the generic OG parser. The
 * generic parser falls back to meta tags which, on structured sites like
 * Amazon, produce nonsense (og:site_name="Amazon", og:image=<smile logo>)
 * because the real product data lives elsewhere in the DOM.
 */
export async function ingestProductUrl(input: string): Promise<IngestUrlResult> {
	const url = parseAndValidateUrl(input);

	if (isAmazonUrl(url)) {
		return ingestAmazonUrl(url);
	}

	const { bytes } = await fetchCapped(
		url.toString(),
		MAX_HTML_BYTES,
		'text/html,application/xhtml+xml'
	);
	const html = decodeHtml(bytes);

	// Product name: og:site_name → meta application-name → hostname-derived.
	const productName =
		extractMeta(html, 'og:site_name') ||
		extractMeta(html, 'application-name') ||
		productNameFromHost(url.hostname);

	// Headline: og:title → twitter:title → <title>.
	const headline =
		extractMeta(html, 'og:title') ||
		extractMeta(html, 'twitter:title') ||
		extractTagText(html, 'title') ||
		'';

	// Subhead: og:description → twitter:description → meta description.
	const subhead =
		extractMeta(html, 'og:description') ||
		extractMeta(html, 'twitter:description') ||
		extractMeta(html, 'description') ||
		undefined;

	// Hero image URL: og:image → twitter:image.
	const rawHero =
		extractMeta(html, 'og:image') ||
		extractMeta(html, 'og:image:secure_url') ||
		extractMeta(html, 'twitter:image') ||
		extractMeta(html, 'twitter:image:src');
	const heroImageUrl = rawHero ? resolveImageUrl(rawHero, url) : undefined;

	const partial = !productName || !headline || !subhead;

	return {
		sourceUrl: url.toString(),
		productName: productName || productNameFromHost(url.hostname),
		headline: (headline || '').slice(0, 200),
		subhead: subhead ? subhead.slice(0, 280) : undefined,
		heroImageUrl,
		source: 'generic',
		partial,
		rawHtml: html,
	};
}

// ============================================================
// Amazon product page extractor
// ============================================================
//
// Amazon's og:* tags return site-level defaults (logo image, "Amazon" as
// site name), so the generic parser produces useless results on any
// amazon.* URL. The real product data lives in:
//   - #productTitle (title span)
//   - #feature-bullets li span (the seller's value-prop bullets)
//   - #bylineInfo (brand link: "Visit the X Store" / "Brand: X")
//   - #landingImage (main hero, sometimes inline src only on desktop)
//   - colorImages JSON blob in an inline <script>, contains the full
//     high-res gallery (6-9 images) for every listing
//
// Parsing is regex-based — same style as the generic extractor. No DOM
// library, no new dependency, works on every runtime the generic path does.

const AMAZON_HOST_REGEX =
	/(?:^|\.)amazon\.(?:com|co\.uk|ca|de|fr|it|es|co\.jp|com\.au|in|com\.mx|com\.br|nl|se|pl|sg|ae)$/i;

/** Browser-like headers. Amazon's anti-bot rejects our ShortaBot UA. */
const AMAZON_HEADERS: Record<string, string> = {
	'user-agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
	'accept-language': 'en-US,en;q=0.9',
	'accept-encoding': 'gzip, deflate, br',
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
};

export function isAmazonUrl(url: URL): boolean {
	return AMAZON_HOST_REGEX.test(url.hostname);
}

/**
 * Pull the ASIN out of an Amazon URL. Canonical paths: `/dp/<ASIN>` or
 * `/gp/product/<ASIN>`. Returns undefined if not recognizable (e.g. a
 * search results URL).
 */
export function extractAsin(url: URL): string | undefined {
	const patterns = [/\/dp\/([A-Z0-9]{10})/i, /\/gp\/product\/([A-Z0-9]{10})/i, /\/ASIN\/([A-Z0-9]{10})/i];
	for (const p of patterns) {
		const m = p.exec(url.pathname);
		if (m) return m[1].toUpperCase();
	}
	return undefined;
}

/**
 * Amazon wraps the product image gallery in an inline script that assigns
 * `colorImages` to a variant-keyed object. Each image entry has `hiRes`
 * and `large` URLs. Example:
 *
 *   var data = { ..., "colorImages":{"initial":[{"hiRes":"https://m.media-amazon.com/images/I/...","large":"...",...}, ...]}, ... };
 *
 * Returns the full list of hi-res (or large-fallback) URLs in gallery
 * order. Empty array if the blob isn't found or parsing fails.
 */
export function parseAmazonColorImages(html: string): string[] {
	// Match "colorImages":{ ... } up to the matching close brace. Non-greedy
	// enough not to over-run, lazy enough to find the nested object.
	const blockRe = /"colorImages"\s*:\s*\{[\s\S]*?"initial"\s*:\s*(\[[\s\S]*?\])/;
	const match = blockRe.exec(html);
	if (!match) return [];

	const arrStr = match[1];
	// Extract each image object. Each has at least "hiRes" or "large".
	const imgRe = /\{[^{}]*?(?:"hiRes"\s*:\s*"([^"]+)"|"large"\s*:\s*"([^"]+)")[^{}]*?\}/g;
	const urls: string[] = [];
	let im: RegExpExecArray | null;
	while ((im = imgRe.exec(arrStr)) !== null) {
		// Prefer hiRes, fall back to large. Each obj may contain both keys
		// in any order, so capture both and prefer hiRes when present.
		const whole = im[0];
		const hiRes = /"hiRes"\s*:\s*"([^"]+)"/.exec(whole)?.[1];
		const large = /"large"\s*:\s*"([^"]+)"/.exec(whole)?.[1];
		const pick = hiRes && hiRes !== 'null' ? hiRes : large;
		if (pick) urls.push(pick);
	}
	return urls;
}

/**
 * Pull the bullet list from #feature-bullets. Each bullet is a <li> with
 * a <span class="a-list-item"> containing the text. Amazon wraps these
 * liberally, so we extract span contents within the feature-bullets div.
 */
function extractAmazonBullets(html: string): string[] {
	const divRe = /<div[^>]+id=["']feature-bullets["'][\s\S]*?<\/div>/i;
	const block = divRe.exec(html)?.[0];
	if (!block) return [];
	const spanRe = /<span[^>]*class=["'][^"']*a-list-item[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;
	const out: string[] = [];
	let m: RegExpExecArray | null;
	while ((m = spanRe.exec(block)) !== null) {
		const text = m[1]
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&apos;/g, "'")
			.trim();
		if (text && text.length > 2) out.push(text);
	}
	return out;
}

/** #productTitle span. Trim and normalize whitespace. */
function extractAmazonTitle(html: string): string | undefined {
	const re = /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i;
	const m = re.exec(html)?.[1];
	if (!m) return undefined;
	const cleaned = m
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return cleaned || undefined;
}

/** #bylineInfo anchor. Strips "Visit the ", "Brand:", and trailing "Store". */
function extractAmazonBrand(html: string): string | undefined {
	const re = /<a[^>]+id=["']bylineInfo["'][^>]*>([\s\S]*?)<\/a>/i;
	const m = re.exec(html)?.[1];
	if (!m) return undefined;
	const text = m
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return (
		text
			.replace(/^Visit the\s+/i, '')
			.replace(/^Brand:\s*/i, '')
			.replace(/\s+Store$/i, '')
			.trim() || undefined
	);
}

/** #landingImage <img> src attribute. Fallback when colorImages blob is absent. */
function extractAmazonLandingImage(html: string): string | undefined {
	const re = /<img[^>]+id=["']landingImage["'][^>]*>/i;
	const tag = re.exec(html)?.[0];
	if (!tag) return undefined;
	// Prefer data-old-hires (full-res) over src (thumbnail) when both present.
	const hires = /data-old-hires=["']([^"']+)["']/i.exec(tag)?.[1];
	if (hires) return hires;
	const src = /\bsrc=["']([^"']+)["']/i.exec(tag)?.[1];
	return src || undefined;
}

/**
 * Detect Amazon's anti-bot captcha response. When triggered, the page has
 * no productTitle and instead serves a "Sorry, we just need to make sure
 * you're not a robot" form. We detect by form action.
 */
function isAmazonCaptcha(html: string): boolean {
	return /\/errors\/validateCaptcha/i.test(html);
}

/**
 * Amazon-specific product URL ingestion. Fetches with a real browser UA,
 * parses the product-specific DOM shapes, and returns the same
 * IngestUrlResult shape as the generic parser (with `source: 'amazon'`
 * and a populated `galleryImageUrls` so the UI can auto-fill the
 * screenshot slots).
 */
async function ingestAmazonUrl(url: URL): Promise<IngestUrlResult> {
	// Normalize to the canonical /dp/<ASIN> path when we can, which gives
	// cleaner HTML than affiliate/tracking URLs and dodges some redirects.
	const asin = extractAsin(url);
	const canonical = asin
		? new URL(`https://${url.hostname}/dp/${asin}`)
		: url;

	// Retry once on transient origin 5xx — Amazon edges occasionally flake
	// for no good reason, and a single retry with a small delay resolves
	// most of them. Don't retry on 4xx (likely an auth/robots-style block).
	let bytes: Uint8Array;
	try {
		({ bytes } = await fetchCapped(
			canonical.toString(),
			MAX_HTML_BYTES,
			'text/html,application/xhtml+xml',
			AMAZON_HEADERS
		));
	} catch (err) {
		const isTransient5xx =
			err instanceof IngestUrlError &&
			err.code === 'http_error' &&
			/\b5\d\d\b/.test(err.message);
		if (!isTransient5xx) throw err;
		await new Promise((r) => setTimeout(r, 300));
		({ bytes } = await fetchCapped(
			canonical.toString(),
			MAX_HTML_BYTES,
			'text/html,application/xhtml+xml',
			AMAZON_HEADERS
		));
	}
	const html = decodeHtml(bytes);

	if (isAmazonCaptcha(html)) {
		throw new IngestUrlError(
			'bot_blocked',
			"Amazon blocked the fetch. Try again in a minute, or paste the product's title and main image manually."
		);
	}

	const title = extractAmazonTitle(html);
	const bullets = extractAmazonBullets(html);
	const brand = extractAmazonBrand(html);
	const gallery = parseAmazonColorImages(html);
	const landingImage = extractAmazonLandingImage(html);

	const productName = brand || (title ? title.split(' ').slice(0, 3).join(' ') : undefined);
	const headline = title || bullets[0] || '';
	const subhead = bullets[0] && bullets[0] !== headline ? bullets[0] : bullets[1];

	// Hero preference: first hi-res gallery image > landing image > none.
	const heroImageUrl = gallery[0] || landingImage;
	// Additional gallery slots for the UI's "up to 4" screenshot picker.
	// Drop the first entry (already the hero) and cap at 4.
	const galleryImageUrls = gallery.length > 1 ? gallery.slice(1, 5) : undefined;

	const partial = !title || bullets.length === 0 || !heroImageUrl;

	return {
		sourceUrl: canonical.toString(),
		productName: (productName || 'Product').slice(0, 120),
		headline: (headline || '').slice(0, 200),
		subhead: subhead ? subhead.slice(0, 280) : undefined,
		heroImageUrl,
		galleryImageUrls,
		brand,
		source: 'amazon',
		partial,
		rawHtml: html,
	};
}

/**
 * Download a hero image URL and return the bytes. Enforces SSRF guard on
 * the image host too (og:image from a shady site could still point at
 * internal infra), honors timeout + size cap.
 */
export async function downloadHeroImage(
	url: string
): Promise<{ bytes: Uint8Array; mimeType: string }> {
	const parsed = parseAndValidateUrl(url);
	const { bytes, contentType } = await fetchCapped(parsed.toString(), MAX_IMAGE_BYTES, 'image/*');
	const mimeType = contentType.split(';')[0]?.trim() || 'image/png';
	if (!mimeType.startsWith('image/')) {
		throw new IngestUrlError('http_error', 'Hero URL did not return an image');
	}
	return { bytes, mimeType };
}
