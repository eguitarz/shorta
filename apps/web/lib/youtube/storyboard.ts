/**
 * YouTube Storyboard Sprite Sheet Utility
 *
 * Extracts storyboard sprite sheet data from YouTube's player response.
 * Storyboards are grids of thumbnail frames that YouTube generates for
 * every video — used by the scrubber preview on hover.
 *
 * Zero storage cost. YouTube hosts the images. We just do math to find
 * which sprite sheet and tile contains the frame at a given timestamp.
 *
 * Spec format (pipe-delimited):
 *   baseUrl|width#height#count#cols#rows#intervalMs#name#sigh|...
 *
 * Each pipe section is a different resolution tier:
 *   - L0: ~160x90 per frame, 100-frame grids (10x10)
 *   - L1: ~80x45 per frame
 *   - L2: ~48x27 per frame
 */

export interface StoryboardSize {
  width: number;
  height: number;
  count: number;
  cols: number;
  rows: number;
  intervalMs: number;
  name: string;
  sigh: string;
}

export interface StoryboardSpec {
  baseUrl: string;
  sizes: StoryboardSize[];
}

export interface FrameLocation {
  /** Full URL to the sprite sheet image */
  url: string;
  /** X offset in pixels within the sprite sheet */
  x: number;
  /** Y offset in pixels within the sprite sheet */
  y: number;
  /** Width of one frame tile */
  width: number;
  /** Height of one frame tile */
  height: number;
}

/**
 * Parse a YouTube storyboard spec string into structured data.
 */
export function parseStoryboardSpec(spec: string): StoryboardSpec | null {
  if (!spec) return null;

  const sections = spec.split('|');
  if (sections.length < 2) return null;

  const baseUrl = sections[0];
  const sizes: StoryboardSize[] = [];

  for (let i = 1; i < sections.length; i++) {
    const parts = sections[i].split('#');
    if (parts.length < 8) continue;

    sizes.push({
      width: parseInt(parts[0], 10),
      height: parseInt(parts[1], 10),
      count: parseInt(parts[2], 10),
      cols: parseInt(parts[3], 10),
      rows: parseInt(parts[4], 10),
      intervalMs: parseInt(parts[5], 10),
      name: parts[6],
      sigh: parts[7],
    });
  }

  if (sizes.length === 0) return null;

  return { baseUrl, sizes };
}

/**
 * Get the best resolution storyboard size (first/largest).
 */
function getBestSize(spec: StoryboardSpec): StoryboardSize {
  // First size is typically the highest resolution
  return spec.sizes[0];
}

/**
 * Build the URL for a specific sprite sheet image.
 *
 * YouTube uses template placeholders:
 *   $L = size index (0 for best quality)
 *   $N = image name from spec
 *   $M = sprite sheet number (0-indexed)
 */
function buildSpriteUrl(
  baseUrl: string,
  sizeIndex: number,
  size: StoryboardSize,
  sheetNumber: number
): string {
  return baseUrl
    .replace('$L', String(sizeIndex))
    .replace('$N', size.name)
    .replace('$M', String(sheetNumber));
}

/**
 * Calculate which sprite sheet and tile contains the frame at a given timestamp.
 *
 * @param spec - Parsed storyboard spec
 * @param timestampSeconds - Time in seconds to find the frame for
 * @returns Frame location with URL and CSS offset, or null if out of range
 */
export function getFrameAtTimestamp(
  spec: StoryboardSpec,
  timestampSeconds: number
): FrameLocation | null {
  const sizeIndex = 0; // Use best quality
  const size = getBestSize(spec);

  if (!size || size.intervalMs <= 0) return null;

  const intervalSeconds = size.intervalMs / 1000;
  const framesPerSheet = size.cols * size.rows;

  // Which frame number overall
  const frameIndex = Math.floor(timestampSeconds / intervalSeconds);

  // Which sprite sheet image
  const sheetNumber = Math.floor(frameIndex / framesPerSheet);

  // Position within the sheet
  const indexInSheet = frameIndex % framesPerSheet;
  const row = Math.floor(indexInSheet / size.cols);
  const col = indexInSheet % size.cols;

  const url = buildSpriteUrl(spec.baseUrl, sizeIndex, size, sheetNumber);

  return {
    url,
    x: col * size.width,
    y: row * size.height,
    width: size.width,
    height: size.height,
  };
}

/**
 * Parse a timestamp string like "0:03" or "2:30" or "1:05:30" into seconds.
 */
export function parseTimestamp(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/**
 * Fetch the storyboard spec from YouTube by scraping the watch page.
 * Returns the raw spec string, or null if not found.
 */
/**
 * Fetch storyboard spec using YouTube's InnerTube API.
 * This works from cloud IPs (unlike scraping the watch page)
 * because InnerTube is YouTube's official internal API.
 */
export async function fetchStoryboardSpec(videoId: string): Promise<string | null> {
  try {
    // Use InnerTube player endpoint — works from server-side without cookies
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '19.09.37',
            hl: 'en',
          },
        },
        videoId,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const spec = data?.storyboards?.playerStoryboardSpecRenderer?.spec;

    return spec || null;
  } catch (e) {
    console.error('[storyboard] Failed to fetch spec via InnerTube:', e);
    return null;
  }
}
