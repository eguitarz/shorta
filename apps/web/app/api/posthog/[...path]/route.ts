import { NextRequest, NextResponse } from 'next/server';

const POSTHOG_API_HOST = 'https://us.i.posthog.com';
const POSTHOG_ASSET_HOST = 'https://us-assets.i.posthog.com';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	return handleRequest(request, await params);
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	return handleRequest(request, await params);
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	return handleRequest(request, await params);
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	return handleRequest(request, await params);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	return handleRequest(request, await params);
}

async function handleRequest(
	request: NextRequest,
	params: { path: string[] }
) {
	try {
		const path = params.path.join('/');
		const searchParams = new URL(request.url).searchParams;
		// Force PostHog to capture IP by setting this param, as client may send ip=0
		searchParams.set('ip', '1');

		const searchParamsStr = searchParams.toString();
		const queryString = searchParamsStr ? `?${searchParamsStr}` : '';

		// Determine which host to use based on the path. Static assets go to
		// the asset host, everything else (events, session recording, etc.) to
		// the API host.
		const isStaticAsset = path.startsWith('static/') || path.startsWith('_next/static/');
		const targetHost = isStaticAsset ? POSTHOG_ASSET_HOST : POSTHOG_API_HOST;
		const targetUrl = `${targetHost}/${path}${queryString}`;

		// Build forwarded headers. Strip hop-by-hop + host-specific headers.
		const forwardedHeaders = new Headers();
		request.headers.forEach((value, key) => {
			const lowerKey = key.toLowerCase();
			if (
				lowerKey !== 'host' &&
				lowerKey !== 'connection' &&
				lowerKey !== 'content-length' &&
				lowerKey !== 'transfer-encoding'
			) {
				forwardedHeaders.set(key, value);
			}
		});

		// Preserve the real client IP so PostHog attributes sessions correctly.
		const clientIp =
			request.headers.get('cf-connecting-ip') ||
			request.ip ||
			request.headers.get('x-forwarded-for') ||
			request.headers.get('x-real-ip');
		if (clientIp) {
			forwardedHeaders.set('X-Forwarded-For', clientIp.split(',')[0].trim());
		}

		// STREAM the body instead of buffering. Session-recording payloads can
		// be hundreds of KB each — buffering them in memory blows the CF
		// Workers CPU budget at any real traffic level. Passing request.body
		// as a ReadableStream keeps the proxy on the happy path where no byte
		// is copied in the isolate.
		const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
		const proxyResponse = await fetch(targetUrl, {
			method: request.method,
			headers: forwardedHeaders,
			body: hasBody ? (request.body as ReadableStream | null) : null,
			// duplex: 'half' is REQUIRED when sending a streaming body with fetch.
			// The Workers runtime supports it; Node typings may not have the
			// field yet, hence the cast.
			...(hasBody ? { duplex: 'half' } : {}),
		} as RequestInit);

		// Pass the PostHog response body straight back as a stream. No
		// .text() / .arrayBuffer() — same CPU reasoning as the request side.
		const responseHeaders = new Headers({
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400',
		});
		const passthroughHeaders = [
			'content-type',
			'cache-control',
			'etag',
			'last-modified',
			'content-encoding',
			'vary',
		];
		for (const h of passthroughHeaders) {
			const value = proxyResponse.headers.get(h);
			if (value) responseHeaders.set(h, value);
		}
		if (!responseHeaders.has('content-type')) {
			responseHeaders.set('content-type', 'application/json');
		}

		return new NextResponse(proxyResponse.body, {
			status: proxyResponse.status,
			statusText: proxyResponse.statusText,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error('PostHog proxy error:', error);
		return NextResponse.json(
			{ error: 'Proxy error' },
			{ status: 500 }
		);
	}
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400',
		},
	});
}

