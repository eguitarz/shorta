import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateCsrf } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';
import { decryptToken, getEncryptionKey } from '@/lib/youtube/encryption';
import { revokeToken } from '@/lib/youtube/client';
import type { YouTubeConnection } from '@/lib/youtube/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/youtube/disconnect
 * Disconnects the user's YouTube account.
 * Revokes the Google token and deletes connection + channel data.
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

  const supabase = createServiceClient();

  try {
    // Fetch current connection to revoke token
    const { data: connection } = await supabase
      .from('youtube_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connection) {
      const conn = connection as YouTubeConnection;
      // Best-effort token revocation
      try {
        const encryptionKey = getEncryptionKey();
        const accessToken = await decryptToken(conn.access_token_encrypted, encryptionKey);
        await revokeToken(accessToken);
      } catch {
        // Revocation is best-effort
      }
    }

    // Delete channel videos
    await supabase
      .from('channel_videos')
      .delete()
      .eq('user_id', user.id);

    // Delete channel profile
    await supabase
      .from('channel_profiles')
      .delete()
      .eq('user_id', user.id);

    // Delete connection
    await supabase
      .from('youtube_connections')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('YouTube disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect YouTube' },
      { status: 500 }
    );
  }
}
