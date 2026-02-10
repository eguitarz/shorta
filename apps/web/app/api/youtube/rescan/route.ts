import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateCsrf } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/youtube/rescan
 * Triggers a fresh video sync + niche re-detection.
 * Delegates to the sync-videos endpoint internally.
 */
export async function POST(request: NextRequest) {
  // CSRF check
  const csrfResult = validateCsrf(request);
  if (!csrfResult.isValid) {
    return NextResponse.json({ error: csrfResult.error }, { status: 403 });
  }

  // Auth check
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Forward to sync-videos endpoint
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const syncResponse = await fetch(`${appUrl}/api/youtube/sync-videos`, {
    method: 'POST',
    headers: {
      cookie: request.headers.get('cookie') || '',
      origin: request.headers.get('origin') || appUrl,
      referer: request.headers.get('referer') || appUrl,
    },
  });

  if (!syncResponse.ok) {
    const error = await syncResponse.json();
    return NextResponse.json(error, { status: syncResponse.status });
  }

  const result = await syncResponse.json();
  return NextResponse.json({
    ...result,
    message: 'Channel rescanned successfully',
  });
}
