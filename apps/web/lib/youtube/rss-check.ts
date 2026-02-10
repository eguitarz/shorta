/**
 * RSS-based new video detection for YouTube channels.
 *
 * Uses YouTube's free Atom RSS feed (0 API quota) to detect
 * newly uploaded videos by comparing against known video IDs.
 * Feed URL: https://www.youtube.com/feeds/videos.xml?channel_id={channelId}
 */

const YOUTUBE_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml';

/**
 * Check for new videos via YouTube's RSS feed.
 * Returns video IDs that are NOT in the existingVideoIds set.
 *
 * @param channelId - YouTube channel ID
 * @param existingVideoIds - Set of video IDs already in the database
 * @returns Array of new video IDs not yet in the database
 */
export async function checkNewVideosViaRss(
  channelId: string,
  existingVideoIds: Set<string>
): Promise<string[]> {
  const url = `${YOUTUBE_RSS_BASE}?channel_id=${channelId}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/atom+xml' },
    // Short timeout — RSS should respond fast
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    console.error(`[rss-check] RSS fetch failed: ${response.status}`);
    return [];
  }

  const xml = await response.text();

  // Extract video IDs from <yt:videoId>...</yt:videoId> tags
  const videoIdRegex = /<yt:videoId>([^<]+)<\/yt:videoId>/g;
  const rssVideoIds: string[] = [];
  let match;

  while ((match = videoIdRegex.exec(xml)) !== null) {
    rssVideoIds.push(match[1]);
  }

  // Return only IDs not already in the database
  const newVideoIds = rssVideoIds.filter((id) => !existingVideoIds.has(id));

  if (newVideoIds.length > 0) {
    console.log(`[rss-check] Found ${newVideoIds.length} new video(s) via RSS:`, newVideoIds);
  }

  return newVideoIds;
}
