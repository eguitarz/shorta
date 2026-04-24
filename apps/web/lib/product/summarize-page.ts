/**
 * Distill a product landing page into a structured demo brief.
 *
 * Pipeline:
 *   1. Fetch clean markdown from the page via Jina Reader (`r.jina.ai/<url>`).
 *      Handles JS-rendered SPAs, strips nav/ads/footers, preserves hierarchy.
 *   2. Feed the markdown + optional OG hero image metadata into Gemini with a
 *      structured JSON prompt.
 *   3. Return a ProductDemoBrief suitable for injecting into the animation
 *      story/beat/image prompts.
 *
 * The OG/title/description extraction from ingest-url.ts still runs as a
 * fast-path for productName/headline/subhead. This summarizer ADDS the
 * richer fields (valueProps, features, colorScheme inference, CTA variants).
 *
 * Failure modes:
 *   - Jina unreachable or rate-limited → return { ok: false }; caller
 *     continues with OG-only extraction.
 *   - Gemini returns malformed JSON → return { ok: false }.
 *
 * Neither is fatal. The wizard downgrades to OG-only fields when the brief
 * isn't available.
 */

import type { ProductDemoBrief } from '@/lib/types/beat';
import { createDefaultLLMClient } from '@/lib/llm';
import type { FileAttachment, LLMEnv } from '@/lib/llm/types';
import { parseAndValidateUrl } from './ingest-url';

const JINA_READER_TIMEOUT_MS = 8_000;
const JINA_RESPONSE_MAX_BYTES = 512 * 1024; // 512KB of markdown is plenty
const GEMINI_MAX_INPUT_CHARS = 8_000; // trim markdown before handing to Gemini
const EXTRA_IMAGE_TIMEOUT_MS = 4_000;
const EXTRA_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2MB per extra image
const MAX_EXTRA_IMAGES = 2;
const IMAGE_VISION_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export interface SummarizePageInput {
	url: string;
	/** The OG-scraped fallbacks to include in the Gemini prompt as context. */
	fallbackProductName?: string;
	fallbackHeadline?: string;
	fallbackSubhead?: string;
	heroImageUrl?: string;
	/**
	 * Optional pre-fetched hero image bytes. If provided, we skip re-fetching
	 * and attach them as a vision input on the Gemini call. Caller (the route)
	 * already downloads the hero into the bucket — pass the same bytes here.
	 */
	heroImageBytes?: { mimeType: string; data: string }; // data = base64
	/**
	 * Optional raw HTML body the caller already fetched. Used as a Jina
	 * fallback — if Jina fails or returns nothing, we strip this HTML to
	 * plain text and feed that to Gemini instead. Better-than-nothing.
	 */
	fallbackHtml?: string;
	env: LLMEnv;
	locale?: string;
}

/**
 * Raw image bytes we attached to the Gemini call, indexed in the same order
 * Gemini sees them (0 = hero if provided, then page-image-1, page-image-2).
 * Returned so the route can upload the ones Gemini picked as characters
 * into the character-sheets bucket.
 */
export interface AttachedImage {
	mimeType: string;
	/** Base64-encoded bytes. */
	data: string;
	/** Label matching the "IMAGE 0", "IMAGE 1"... index in the prompt. */
	geminiIndex: number;
}

export type SummarizePageResult =
	| {
			ok: true;
			brief: ProductDemoBrief;
			markdownLength: number;
			attachedImages: AttachedImage[];
	  }
	| { ok: false; reason: string };

export interface JinaFetchResult {
	ok: boolean;
	markdown?: string;
	/** HTTP status if we got a response (0 for network error / timeout). */
	status: number;
	/** Human-readable reason on failure. */
	reason?: string;
}

/**
 * Fetch clean markdown from Jina Reader. Returns a structured result so
 * callers can log the HTTP status and decide whether to fall back.
 */
export async function fetchJinaMarkdown(url: string): Promise<JinaFetchResult> {
	const readerUrl = `https://r.jina.ai/${url}`;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), JINA_READER_TIMEOUT_MS);
	try {
		const res = await fetch(readerUrl, {
			signal: controller.signal,
			headers: {
				accept: 'text/plain',
				// Jina's default token returns markdown; adding these headers gives
				// us slightly richer metadata + keeps images/links.
				'x-return-format': 'markdown',
				'x-with-links-summary': 'true',
				// Auth with a Jina API key if one is configured — higher rate
				// limits + priority routing. Anonymous fallback still works.
				...(process.env.JINA_API_KEY
					? { authorization: `Bearer ${process.env.JINA_API_KEY}` }
					: {}),
			},
		});
		if (!res.ok) {
			// Read a small slice of the error body for debugging.
			let snippet = '';
			try {
				snippet = (await res.text()).slice(0, 200);
			} catch {
				// ignore
			}
			return {
				ok: false,
				status: res.status,
				reason: `jina_http_${res.status}${snippet ? `: ${snippet}` : ''}`,
			};
		}
		const reader = res.body?.getReader();
		if (!reader) {
			return { ok: false, status: res.status, reason: 'jina_empty_body' };
		}
		const chunks: Uint8Array[] = [];
		let total = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				total += value.byteLength;
				if (total > JINA_RESPONSE_MAX_BYTES) {
					try {
						await reader.cancel();
					} catch {
						// ignore
					}
					break;
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
		const text = new TextDecoder('utf-8', { fatal: false }).decode(merged).trim();
		if (!text || text.length < 50) {
			return { ok: false, status: res.status, reason: 'jina_empty_markdown' };
		}
		return { ok: true, status: res.status, markdown: text };
	} catch (err) {
		const name = (err as { name?: string })?.name;
		const reason =
			name === 'AbortError'
				? 'jina_timeout'
				: `jina_network: ${err instanceof Error ? err.message : String(err)}`;
		return { ok: false, status: 0, reason };
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Fallback when Jina fails: strip HTML down to a roughly-readable plain
 * text form. Good enough for Gemini to infer a brief from — not as clean as
 * Jina markdown, but captures all the copy on a static / SSR'd page.
 */
export function htmlToPlainText(html: string): string {
	return html
		// Remove script/style/noscript blocks wholesale.
		.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
		.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
		// Convert <br> and </p> to newlines before stripping.
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n\n')
		// Drop all remaining tags.
		.replace(/<[^>]+>/g, ' ')
		// Collapse whitespace.
		.replace(/[ \t]+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Extract up to `limit` unique image URLs from Jina markdown in first-seen
 * order. Skips data URIs, relative refs that don't resolve to absolute URLs,
 * and URLs that share the skip list (e.g. the og:image we already have).
 */
export function extractMarkdownImageUrls(
	markdown: string,
	baseUrl: string,
	skip: Set<string>,
	limit: number
): string[] {
	const urls: string[] = [];
	const seen = new Set<string>(skip);
	// Match ![alt](url) — url allowed to contain non-space, non-paren chars.
	const re = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(markdown)) !== null) {
		if (urls.length >= limit) break;
		const raw = match[1].trim();
		if (!raw || raw.startsWith('data:')) continue;
		let resolved: string;
		try {
			resolved = new URL(raw, baseUrl).toString();
		} catch {
			continue;
		}
		if (seen.has(resolved)) continue;
		// Skip obvious non-vision formats (svg, video) fast — Gemini vision
		// accepts png/jpeg/webp/gif only.
		if (/\.svg(\?|$)/i.test(resolved) || /\.(mp4|webm|mov)(\?|$)/i.test(resolved)) continue;
		urls.push(resolved);
		seen.add(resolved);
	}
	return urls;
}

/**
 * Fetch an image with SSRF guard (https-only, no private IPs) + timeout +
 * size cap. Returns null on any failure — extra images are best-effort.
 */
async function fetchVisionImage(
	rawUrl: string
): Promise<FileAttachment | null> {
	let parsed;
	try {
		parsed = parseAndValidateUrl(rawUrl);
	} catch {
		return null;
	}
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), EXTRA_IMAGE_TIMEOUT_MS);
	try {
		const res = await fetch(parsed.toString(), {
			signal: controller.signal,
			redirect: 'follow',
			headers: {
				accept: 'image/*',
				'user-agent': 'Mozilla/5.0 (compatible; ShortaBot/1.0; +https://shorta.app)',
			},
		});
		if (!res.ok) return null;
		const contentType = (res.headers.get('content-type') || '').split(';')[0]?.trim().toLowerCase();
		if (!contentType || !IMAGE_VISION_MIME.has(contentType)) return null;
		const reader = res.body?.getReader();
		if (!reader) return null;
		const chunks: Uint8Array[] = [];
		let total = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				total += value.byteLength;
				if (total > EXTRA_IMAGE_MAX_BYTES) {
					try {
						await reader.cancel();
					} catch {
						// ignore
					}
					return null;
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
		const base64 = Buffer.from(merged).toString('base64');
		return { mimeType: contentType, data: base64, name: 'page-image' };
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

function buildSummaryPrompt(args: {
	url: string;
	markdown: string;
	fallbackProductName?: string;
	fallbackHeadline?: string;
	fallbackSubhead?: string;
	heroImageUrl?: string;
	locale?: string;
}): string {
	const {
		url,
		markdown,
		fallbackProductName,
		fallbackHeadline,
		fallbackSubhead,
		heroImageUrl,
		locale,
	} = args;

	const localeInstruction =
		locale && locale !== 'en'
			? `\nLANGUAGE: Write all human-readable string values in locale '${locale}'. Keep JSON keys in English.`
			: '';

	return `You are extracting a product-demo brief from a landing page. The output drives an animated product-demo short, so your output must be concrete, on-voice, and visually specific.

SOURCE URL: ${url}
FALLBACK SIGNALS (from og:tags — use only if the markdown below is weaker):
- productName: ${fallbackProductName ?? '(none)'}
- headline: ${fallbackHeadline ?? '(none)'}
- subhead: ${fallbackSubhead ?? '(none)'}
${heroImageUrl ? `- heroImageUrl: ${heroImageUrl}` : ''}

PAGE MARKDOWN (cleaned by Jina Reader):
<<<
${markdown.slice(0, GEMINI_MAX_INPUT_CHARS)}
>>>

ATTACHED IMAGES: Up to 3 images from this page are attached in order — IMAGE 0 (hero), IMAGE 1 (page-image-1), IMAGE 2 (page-image-2). Use them to:
  (a) infer brandSignals — name actual colors you SEE, typography feel (serif/geometric/rounded), and the UI mood. Prefer what you see over what you'd guess from copy alone.
  (b) spot reusable characters — any mascot, illustrated figure, avatar, or clear single-person photo present in these images is a candidate the user may want to reuse verbatim in the animated demo. Return them in suggestedCharacters with their sheetImageIndex referencing which attached image contains the character. Describe what you see: appearance (species/gender/age/build), distinguishing features (colors, accessories, style), and personality you'd infer from body language or context. Do NOT invent characters the images don't show.

Produce STRICT JSON with this shape:

{
  "oneLiner": "<one sentence describing the product, punchier than the headline. Written in the product's own voice.>",
  "valueProps": ["<short value prop 1>", "<short value prop 2>", "<short value prop 3>"],
  "features": [
    { "name": "<feature name>", "benefit": "<one-line benefit>" },
    { "name": "...", "benefit": "..." }
  ],
  "inferredTone": "<tone inferred from copy — e.g., 'efficient, confident, non-hypey' or 'playful, warm, approachable'>",
  "inferredAudience": "<who the product is for, 1 sentence>",
  "ctaSuggestions": ["<cta variant 1>", "<cta variant 2>", "<cta variant 3>"],
  "brandSignals": "<visual brand cues inferred from markdown + hero image metadata. Name specific colors ('deep navy with amber accent'), typography feel ('geometric sans, high tracking'), and any notable UI motifs. One sentence.>",
  "recommendedStyleAnchor": "<one-line style direction for an animated demo — e.g., 'Clean SaaS marketing, desaturated palette, amber accent, geometric sans headers'>",
  "avoid": ["<pitfall 1>", "<pitfall 2>"],
  "suggestedCharacters": [
    {
      "name": "<short label, e.g. 'Tabnora fox mascot' or 'Alex, founder'>",
      "traits": ["<trait 1>", "<trait 2>", "<trait 3>"],
      "personality": "<one sentence>",
      "sheetImageIndex": 0
    }
  ]
}

RULES:
- Be specific to THIS product. Never generic marketing phrases.
- valueProps: 3-5 items. Each under 10 words.
- features: 2-4 items. Benefit must be concrete.
- ctaSuggestions: 2-4 items. Each under 6 words.
- brandSignals: must reference actual color(s) from the markdown or heroImageUrl context. If unknown, say so and guess defensibly.
- avoid: 2-3 items. What a generic AI demo would get wrong about THIS product.
- suggestedCharacters: 0-2 items. ONLY include if an attached image clearly contains a character. If the images are pure UI screenshots or abstract graphics, omit this field or return an empty array. Each item MUST include sheetImageIndex pointing at the image that shows the character (0, 1, or 2).
- If the markdown is thin (login wall, 404, SPA shell), return your best guess using only the fallback signals and say so in 'avoid'.

RESPONSE FORMAT: Return ONLY the JSON object. No markdown fences, no preamble, no trailing text.${localeInstruction}`;
}

function extractJsonObject(text: string): unknown {
	const trimmed = text.trim();
	// Strip markdown code fences if present.
	const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```\s*$/i.exec(trimmed);
	const raw = fenced ? fenced[1] : trimmed;
	try {
		return JSON.parse(raw);
	} catch {
		// Try to find the first { ... } block.
		const first = raw.indexOf('{');
		const last = raw.lastIndexOf('}');
		if (first >= 0 && last > first) {
			try {
				return JSON.parse(raw.slice(first, last + 1));
			} catch {
				return null;
			}
		}
		return null;
	}
}

function clampString(v: unknown, max: number): string | undefined {
	if (typeof v !== 'string') return undefined;
	const trimmed = v.trim();
	return trimmed ? trimmed.slice(0, max) : undefined;
}

function clampStringArray(v: unknown, maxItems: number, maxItemLen: number): string[] | undefined {
	if (!Array.isArray(v)) return undefined;
	const out = v
		.map((x) => clampString(x, maxItemLen))
		.filter((x): x is string => !!x)
		.slice(0, maxItems);
	return out.length ? out : undefined;
}

/**
 * Intermediate shape — Gemini returns sheetImageIndex; the route converts
 * that into sheetStoragePath after uploading the image.
 */
export interface SuggestedCharacterRaw {
	name: string;
	traits: string[];
	personality: string;
	sheetImageIndex: number;
}

function normalizeBrief(
	raw: unknown
): { brief: ProductDemoBrief; suggestedCharactersRaw: SuggestedCharacterRaw[] } {
	const r = (raw ?? {}) as Record<string, unknown>;

	const features = Array.isArray(r.features)
		? (r.features as unknown[])
				.map((f) => {
					if (!f || typeof f !== 'object') return null;
					const fr = f as Record<string, unknown>;
					const name = clampString(fr.name, 80);
					const benefit = clampString(fr.benefit, 200);
					if (!name || !benefit) return null;
					return { name, benefit };
				})
				.filter((x): x is { name: string; benefit: string } => !!x)
				.slice(0, 5)
		: undefined;

	const suggestedCharactersRaw: SuggestedCharacterRaw[] = Array.isArray(r.suggestedCharacters)
		? (r.suggestedCharacters as unknown[])
				.map((c) => {
					if (!c || typeof c !== 'object') return null;
					const cr = c as Record<string, unknown>;
					const name = clampString(cr.name, 60);
					const personality = clampString(cr.personality, 200);
					const traits = clampStringArray(cr.traits, 8, 60) ?? [];
					const idxRaw = cr.sheetImageIndex;
					const idx = typeof idxRaw === 'number' ? Math.trunc(idxRaw) : -1;
					if (!name || !personality || idx < 0) return null;
					return { name, personality, traits, sheetImageIndex: idx };
				})
				.filter((x): x is SuggestedCharacterRaw => !!x)
				.slice(0, 2)
		: [];

	const brief: ProductDemoBrief = {
		oneLiner: clampString(r.oneLiner, 240),
		valueProps: clampStringArray(r.valueProps, 6, 120),
		features: features && features.length ? features : undefined,
		inferredTone: clampString(r.inferredTone, 200),
		inferredAudience: clampString(r.inferredAudience, 200),
		ctaSuggestions: clampStringArray(r.ctaSuggestions, 5, 80),
		brandSignals: clampString(r.brandSignals, 400),
		recommendedStyleAnchor: clampString(r.recommendedStyleAnchor, 240),
		avoid: clampStringArray(r.avoid, 5, 160),
	};

	return { brief, suggestedCharactersRaw };
}

/**
 * End-to-end: Jina markdown → Gemini brief.
 */
export async function summarizeProductPage(
	input: SummarizePageInput
): Promise<SummarizePageResult> {
	const jina = await fetchJinaMarkdown(input.url);
	let markdown: string;
	let contentSource: 'jina' | 'html_fallback';
	if (jina.ok && jina.markdown) {
		markdown = jina.markdown;
		contentSource = 'jina';
	} else {
		// Jina unavailable — log the reason so we can see it in Worker logs,
		// then fall back to the raw HTML the caller already fetched. Gemini
		// handles plain text fine; quality is lower but non-zero.
		console.warn(
			`[summarizeProductPage] Jina failed for ${input.url}: ${jina.reason ?? 'unknown'}`
		);
		if (!input.fallbackHtml || input.fallbackHtml.length < 200) {
			return {
				ok: false,
				reason: jina.reason ?? 'jina_unavailable_or_empty',
			};
		}
		markdown = htmlToPlainText(input.fallbackHtml);
		if (markdown.length < 200) {
			return {
				ok: false,
				reason: `${jina.reason ?? 'jina_failed'}; html_fallback_too_thin`,
			};
		}
		contentSource = 'html_fallback';
	}

	let client;
	try {
		client = createDefaultLLMClient(input.env);
	} catch (err) {
		return {
			ok: false,
			reason: `llm_init_failed: ${err instanceof Error ? err.message : String(err)}`,
		};
	}

	const prompt = buildSummaryPrompt({
		url: input.url,
		markdown,
		fallbackProductName: input.fallbackProductName,
		fallbackHeadline: input.fallbackHeadline,
		fallbackSubhead: input.fallbackSubhead,
		heroImageUrl: input.heroImageUrl,
		locale: input.locale,
	});

	// Assemble visual inputs: hero (if provided, already in bucket) + up to
	// MAX_EXTRA_IMAGES pulled from the Jina markdown. Best-effort — any fetch
	// failure is swallowed, Gemini still runs on text + whatever made it.
	const visionFiles: FileAttachment[] = [];
	const attachedImages: AttachedImage[] = [];
	if (input.heroImageBytes) {
		visionFiles.push({
			mimeType: input.heroImageBytes.mimeType,
			data: input.heroImageBytes.data,
			name: 'hero',
		});
		attachedImages.push({
			mimeType: input.heroImageBytes.mimeType,
			data: input.heroImageBytes.data,
			geminiIndex: 0,
		});
	}
	const skipUrls = new Set<string>();
	if (input.heroImageUrl) skipUrls.add(input.heroImageUrl);
	const extraUrls = extractMarkdownImageUrls(
		markdown,
		input.url,
		skipUrls,
		MAX_EXTRA_IMAGES
	);
	// Fetch extras in parallel; each call is independently timed/capped.
	const fetched = await Promise.all(extraUrls.map((u) => fetchVisionImage(u)));
	for (let i = 0; i < fetched.length; i++) {
		const f = fetched[i];
		if (f) {
			const geminiIndex = attachedImages.length;
			visionFiles.push({ ...f, name: `page-image-${i + 1}` });
			attachedImages.push({
				mimeType: f.mimeType,
				data: f.data,
				geminiIndex,
			});
		}
	}

	let raw;
	try {
		const response = await client.chat(
			[{ role: 'user', content: prompt, files: visionFiles.length ? visionFiles : undefined }],
			{ model: 'gemini-3-flash-preview', temperature: 0.4, maxTokens: 2048 }
		);
		raw = extractJsonObject(response.content);
	} catch (err) {
		return {
			ok: false,
			reason: `llm_error: ${err instanceof Error ? err.message : String(err)}`,
		};
	}

	if (!raw || typeof raw !== 'object') {
		return { ok: false, reason: 'llm_returned_unparseable_json' };
	}

	const { brief, suggestedCharactersRaw } = normalizeBrief(raw);

	// Breadcrumb log so Worker logs tell us which path produced the brief.
	console.log(
		`[summarizeProductPage] ${input.url} brief via ${contentSource} (md=${markdown.length} chars, imgs=${attachedImages.length}, chars=${suggestedCharactersRaw.length})`
	);

	// Attach the suggestedCharacters onto the brief as a placeholder; the
	// ingest-url route will replace with sheetStoragePath-populated entries
	// after it uploads the corresponding images. Store the raw index-based
	// version on a sidechannel for the route.
	return {
		ok: true,
		brief: {
			...brief,
			suggestedCharacters: suggestedCharactersRaw.map((c) => ({
				name: c.name,
				traits: c.traits,
				personality: c.personality,
				// Placeholder — route fills in real paths after upload.
				sheetStoragePath: `__pending_index_${c.sheetImageIndex}__`,
			})),
		},
		markdownLength: markdown.length,
		attachedImages,
	};
}
