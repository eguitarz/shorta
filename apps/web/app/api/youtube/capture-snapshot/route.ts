import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateCsrf } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';
import { captureChannelSnapshot } from '@/lib/youtube/snapshot';

export const dynamic = 'force-dynamic';

/**
 * POST /api/youtube/capture-snapshot
 * Captures today's channel stats snapshot (idempotent).
 * Called on My Channel page load to ensure data freshness.
 */
export async function POST(request: NextRequest) {
  const csrfResult = validateCsrf(request);
  if (!csrfResult.isValid) {
    return NextResponse.json({ error: csrfResult.error }, { status: 403 });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const captured = await captureChannelSnapshot(user.id, supabase);
    return NextResponse.json({ captured });
  } catch (error) {
    console.error('Capture snapshot error:', error);
    return NextResponse.json({ error: 'Failed to capture snapshot' }, { status: 500 });
  }
}
