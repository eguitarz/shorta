import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	isAmazonUrl,
	extractAsin,
	parseAmazonColorImages,
	ingestProductUrl,
	IngestUrlError,
} from '../lib/product/ingest-url';

// ---------------------------------------------------------------
// URL detection + ASIN extraction (pure functions, no network)
// ---------------------------------------------------------------

describe('isAmazonUrl', () => {
	it('matches amazon.com', () => {
		expect(isAmazonUrl(new URL('https://www.amazon.com/dp/B0XXXX'))).toBe(true);
	});
	it('matches international TLDs', () => {
		for (const host of [
			'https://www.amazon.co.uk/dp/B0XXXX',
			'https://www.amazon.de/dp/B0XXXX',
			'https://www.amazon.co.jp/dp/B0XXXX',
			'https://amazon.com.br/dp/B0XXXX',
		]) {
			expect(isAmazonUrl(new URL(host))).toBe(true);
		}
	});
	it('rejects amazon-lookalike domains', () => {
		expect(isAmazonUrl(new URL('https://amazonthings.com/dp/foo'))).toBe(false);
		expect(isAmazonUrl(new URL('https://fakeamazon.com/dp/bar'))).toBe(false);
		expect(isAmazonUrl(new URL('https://shopify.com/dp/baz'))).toBe(false);
	});
});

describe('extractAsin', () => {
	it('pulls ASIN from /dp/<ASIN>', () => {
		expect(extractAsin(new URL('https://www.amazon.com/OMIC-LightenUp/dp/B0BX4KXB5L/'))).toBe(
			'B0BX4KXB5L'
		);
	});
	it('pulls ASIN from /gp/product/<ASIN>', () => {
		expect(extractAsin(new URL('https://www.amazon.com/gp/product/B0BX4KXB5L'))).toBe(
			'B0BX4KXB5L'
		);
	});
	it('pulls ASIN from /ASIN/<ASIN>', () => {
		expect(extractAsin(new URL('https://www.amazon.com/ASIN/B0BX4KXB5L'))).toBe('B0BX4KXB5L');
	});
	it('ignores tracking params and still extracts', () => {
		expect(
			extractAsin(
				new URL(
					'https://www.amazon.com/OMIC-LightenUp/dp/B0BX4KXB5L/?_encoding=UTF8&tag=ref123'
				)
			)
		).toBe('B0BX4KXB5L');
	});
	it('returns undefined for a search page URL', () => {
		expect(extractAsin(new URL('https://www.amazon.com/s?k=body+oil'))).toBeUndefined();
	});
});

// ---------------------------------------------------------------
// colorImages JSON blob parsing
// ---------------------------------------------------------------

describe('parseAmazonColorImages', () => {
	it('extracts hi-res URLs from the canonical blob shape', () => {
		const html = `<script>var data = {"colorImages":{"initial":[
			{"hiRes":"https://m.media-amazon.com/images/I/AAAA._SL1500_.jpg","large":"https://m.media-amazon.com/images/I/AAAA._SL500_.jpg"},
			{"hiRes":"https://m.media-amazon.com/images/I/BBBB._SL1500_.jpg","large":"https://m.media-amazon.com/images/I/BBBB._SL500_.jpg"}
		]}};</script>`;
		expect(parseAmazonColorImages(html)).toEqual([
			'https://m.media-amazon.com/images/I/AAAA._SL1500_.jpg',
			'https://m.media-amazon.com/images/I/BBBB._SL1500_.jpg',
		]);
	});

	it('falls back to large when hiRes is null', () => {
		const html = `<script>"colorImages":{"initial":[
			{"hiRes":null,"large":"https://m.media-amazon.com/images/I/LARGE._SL500_.jpg"}
		]}</script>`;
		expect(parseAmazonColorImages(html)).toEqual([
			'https://m.media-amazon.com/images/I/LARGE._SL500_.jpg',
		]);
	});

	it('returns [] when no colorImages blob is present', () => {
		expect(parseAmazonColorImages('<html><body>no blob here</body></html>')).toEqual([]);
	});

	it('returns [] for a malformed blob without crashing', () => {
		const html = `<script>"colorImages":{"initial":[{unclosed</script>`;
		expect(parseAmazonColorImages(html)).toEqual([]);
	});
});

// ---------------------------------------------------------------
// Full ingest path with mocked fetch
// ---------------------------------------------------------------

function fixture({
	title = 'OMIC LightenUp Skin Brightening Body Oil 8oz',
	brand = 'Visit the OMIC Store',
	bullets = [
		'Fade dark spots and hyperpigmentation in 4-6 weeks with clinical-strength actives',
		'Nourishes and brightens skin from head to toe with pure plant oils',
		'Vegan, cruelty-free, safe for all skin types',
	],
	landingSrc = 'https://m.media-amazon.com/images/I/HERO._SL300_.jpg',
	landingHires = 'https://m.media-amazon.com/images/I/HERO._SL1500_.jpg',
	gallery = [
		'https://m.media-amazon.com/images/I/G1._SL1500_.jpg',
		'https://m.media-amazon.com/images/I/G2._SL1500_.jpg',
		'https://m.media-amazon.com/images/I/G3._SL1500_.jpg',
		'https://m.media-amazon.com/images/I/G4._SL1500_.jpg',
		'https://m.media-amazon.com/images/I/G5._SL1500_.jpg',
	],
	captcha = false,
}: {
	title?: string;
	brand?: string;
	bullets?: string[];
	landingSrc?: string;
	landingHires?: string;
	gallery?: string[];
	captcha?: boolean;
} = {}): string {
	if (captcha) {
		return `<html><body><form action="/errors/validateCaptcha" method="get">...</form></body></html>`;
	}
	const bulletHtml = bullets
		.map((b) => `<li><span class="a-list-item">${b}</span></li>`)
		.join('');
	const galleryJson = gallery
		.map((u) => `{"hiRes":"${u}","large":"${u.replace('_SL1500_', '_SL500_')}"}`)
		.join(',');
	return `<!doctype html><html><head><title>Amazon.com</title></head><body>
		<a id="bylineInfo" href="/stores">${brand}</a>
		<span id="productTitle">  ${title}  </span>
		<img id="landingImage" src="${landingSrc}" data-old-hires="${landingHires}">
		<div id="feature-bullets"><ul>${bulletHtml}</ul></div>
		<script>var data = {"colorImages":{"initial":[${galleryJson}]}};</script>
	</body></html>`;
}

function mockFetchHtml(html: string) {
	const bytes = new TextEncoder().encode(html);
	return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
		ok: true,
		status: 200,
		statusText: 'OK',
		headers: {
			get: (key: string) => {
				if (key.toLowerCase() === 'content-type') return 'text/html; charset=utf-8';
				if (key.toLowerCase() === 'content-length') return String(bytes.byteLength);
				return null;
			},
		},
		body: {
			getReader: () => {
				let done = false;
				return {
					async read() {
						if (done) return { done: true, value: undefined };
						done = true;
						return { done: false, value: bytes };
					},
					async cancel() {
						/* no-op */
					},
				};
			},
		},
	} as unknown as Response);
}

describe('ingestProductUrl → amazon path', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('extracts title, brand, bullets, hero, and gallery from a realistic Amazon page', async () => {
		mockFetchHtml(fixture());
		const result = await ingestProductUrl(
			'https://www.amazon.com/OMIC-LightenUp-Skin-Brightening-Hyperpigmentation/dp/B0BX4KXB5L/?_encoding=UTF8'
		);
		expect(result.source).toBe('amazon');
		expect(result.brand).toBe('OMIC');
		expect(result.headline).toBe('OMIC LightenUp Skin Brightening Body Oil 8oz');
		expect(result.subhead).toMatch(/Fade dark spots/);
		expect(result.heroImageUrl).toBe('https://m.media-amazon.com/images/I/G1._SL1500_.jpg');
		expect(result.galleryImageUrls).toEqual([
			'https://m.media-amazon.com/images/I/G2._SL1500_.jpg',
			'https://m.media-amazon.com/images/I/G3._SL1500_.jpg',
			'https://m.media-amazon.com/images/I/G4._SL1500_.jpg',
			'https://m.media-amazon.com/images/I/G5._SL1500_.jpg',
		]);
		expect(result.partial).toBe(false);
	});

	it('falls back to landing image data-old-hires when colorImages is missing', async () => {
		mockFetchHtml(fixture({ gallery: [] }));
		const result = await ingestProductUrl('https://www.amazon.com/dp/B0BX4KXB5L');
		expect(result.heroImageUrl).toBe('https://m.media-amazon.com/images/I/HERO._SL1500_.jpg');
		expect(result.galleryImageUrls).toBeUndefined();
	});

	it('strips "Visit the " and trailing " Store" from brand byline', async () => {
		mockFetchHtml(fixture({ brand: 'Visit the Graza Store' }));
		const result = await ingestProductUrl('https://www.amazon.com/dp/B0BX4KXB5L');
		expect(result.brand).toBe('Graza');
	});

	it('strips "Brand: " prefix from brand byline', async () => {
		mockFetchHtml(fixture({ brand: 'Brand: Olipop' }));
		const result = await ingestProductUrl('https://www.amazon.com/dp/B0BX4KXB5L');
		expect(result.brand).toBe('Olipop');
	});

	it('marks partial when title is missing', async () => {
		mockFetchHtml(fixture({ title: '' }).replace(/<span id="productTitle">[^<]*<\/span>/, ''));
		const result = await ingestProductUrl('https://www.amazon.com/dp/B0BX4KXB5L');
		expect(result.partial).toBe(true);
	});

	it('throws bot_blocked IngestUrlError when captcha page is served', async () => {
		mockFetchHtml(fixture({ captcha: true }));
		await expect(
			ingestProductUrl('https://www.amazon.com/dp/B0BX4KXB5L')
		).rejects.toThrow(IngestUrlError);
		mockFetchHtml(fixture({ captcha: true }));
		await expect(
			ingestProductUrl('https://www.amazon.com/dp/B0BX4KXB5L')
		).rejects.toMatchObject({ code: 'bot_blocked' });
	});

	it('normalizes the URL to /dp/<ASIN> before fetching', async () => {
		const spy = mockFetchHtml(fixture());
		await ingestProductUrl(
			'https://www.amazon.com/OMIC-LightenUp/dp/B0BX4KXB5L/?_encoding=UTF8&tag=ref1'
		);
		expect(spy).toHaveBeenCalledOnce();
		const [fetchedUrl] = spy.mock.calls[0];
		expect(fetchedUrl).toBe('https://www.amazon.com/dp/B0BX4KXB5L');
	});

	it('uses browser-like User-Agent for Amazon, not the ShortaBot UA', async () => {
		const spy = mockFetchHtml(fixture());
		await ingestProductUrl('https://www.amazon.com/dp/B0BX4KXB5L');
		const init = spy.mock.calls[0][1] as RequestInit;
		const headers = init.headers as Record<string, string>;
		expect(headers['user-agent']).toMatch(/Mozilla\/5\.0.*Chrome/);
		expect(headers['user-agent']).not.toMatch(/ShortaBot/);
	});

	it('does NOT hit the Amazon path for non-Amazon URLs', async () => {
		// Generic site still reads og:* tags, not productTitle. Confirm routing
		// doesn't accidentally pull in Amazon selectors for tabnora.com.
		const genericHtml = `<!doctype html><html><head>
			<meta property="og:site_name" content="Graza">
			<meta property="og:title" content="Drizzle & Sizzle Olive Oil">
			<meta property="og:image" content="https://graza.co/hero.jpg">
			<meta property="og:description" content="Olive oil you can squeeze">
		</head></html>`;
		mockFetchHtml(genericHtml);
		const result = await ingestProductUrl('https://graza.co');
		expect(result.source).toBe('generic');
		expect(result.productName).toBe('Graza');
		expect(result.heroImageUrl).toBe('https://graza.co/hero.jpg');
		expect((result as any).galleryImageUrls).toBeUndefined();
	});
});
