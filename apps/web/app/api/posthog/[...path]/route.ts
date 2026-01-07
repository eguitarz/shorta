import { NextRequest, NextResponse } from 'next/server';

const POSTHOG_API_HOST = 'https://us.i.posthog.com';
const POSTHOG_ASSET_HOST = 'https://us-assets.i.posthog.com';

export async function GET(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	return handleRequest(request, params);
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	return handleRequest(request, params);
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	return handleRequest(request, params);
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	return handleRequest(request, params);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	return handleRequest(request, params);
}

async function handleRequest(
	request: NextRequest,
	params: { path: string[] }
) {
	try {
		const path = params.path.join('/');
		const searchParams = request.nextUrl.searchParams.toString();
		const queryString = searchParams ? `?${searchParams}` : '';

		// Determine which host to use based on the path
		// Static assets go to asset host, everything else goes to API host
		const isStaticAsset = path.startsWith('static/') || path.startsWith('_next/static/');
		const targetHost = isStaticAsset ? POSTHOG_ASSET_HOST : POSTHOG_API_HOST;
		const targetUrl = `${targetHost}/${path}${queryString}`;

		// Get request body if present
		let body: BodyInit | null = null;
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			try {
				const contentType = request.headers.get('content-type') || '';
				// Handle different content types appropriately
				if (contentType.includes('application/json') || contentType.includes('text/')) {
					body = await request.text();
				} else {
					// For binary data, use array buffer
					body = await request.arrayBuffer();
				}
			} catch {
				// No body or body already consumed
				body = null;
			}
		}

		// Prepare headers - remove host and connection headers, add CORS if needed
		const headers = new Headers();
		request.headers.forEach((value, key) => {
			const lowerKey = key.toLowerCase();
			// Skip headers that shouldn't be forwarded
			if (
				lowerKey !== 'host' &&
				lowerKey !== 'connection' &&
				lowerKey !== 'content-length' &&
				lowerKey !== 'transfer-encoding'
			) {
				headers.set(key, value);
			}
		});

		// Create the proxied request
		const proxyRequest = new Request(targetUrl, {
			method: request.method,
			headers: headers,
			body: body,
		});

		// Fetch from PostHog
		const response = await fetch(proxyRequest);

		// Get response body - handle both text and binary
		const contentType = response.headers.get('Content-Type') || '';
		let responseBody: BodyInit;
		if (contentType.includes('application/json') || contentType.includes('text/')) {
			responseBody = await response.text();
		} else {
			responseBody = await response.arrayBuffer();
		}

		// Create response with CORS headers to allow requests from your domain
		const proxyResponse = new NextResponse(responseBody, {
			status: response.status,
			statusText: response.statusText,
			headers: {
				'Content-Type': contentType || 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Max-Age': '86400',
			},
		});

		// Copy other important headers from PostHog response
		const cacheControl = response.headers.get('Cache-Control');
		if (cacheControl) {
			proxyResponse.headers.set('Cache-Control', cacheControl);
		}
		const etag = response.headers.get('ETag');
		if (etag) {
			proxyResponse.headers.set('ETag', etag);
		}
		const lastModified = response.headers.get('Last-Modified');
		if (lastModified) {
			proxyResponse.headers.set('Last-Modified', lastModified);
		}

		return proxyResponse;
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

