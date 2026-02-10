import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServiceClient } from '@/lib/supabase-service';
import type { YouTubeConnectionInfo } from '@/lib/youtube/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/youtube/status
 * Returns the user's YouTube connection status and channel info.
 * No tokens are ever returned to the client.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('channel_id, channel_title, channel_thumbnail_url, subscriber_count, video_count, status, last_video_sync_at')
    .eq('user_id', user.id)
    .single();

  if (!connection || connection.status === 'disconnected') {
    const info: YouTubeConnectionInfo = {
      connected: false,
      channelId: null,
      channelTitle: null,
      channelThumbnail: null,
      subscriberCount: null,
      videoCount: null,
      status: null,
      lastVideoSync: null,
    };
    return NextResponse.json(info);
  }

  const info: YouTubeConnectionInfo = {
    connected: true,
    channelId: connection.channel_id,
    channelTitle: connection.channel_title,
    channelThumbnail: connection.channel_thumbnail_url,
    subscriberCount: connection.subscriber_count,
    videoCount: connection.video_count,
    status: connection.status,
    lastVideoSync: connection.last_video_sync_at,
  };

  return NextResponse.json(info);
}
