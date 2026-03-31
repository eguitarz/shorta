"use client";

import { useEffect, useState } from "react";
import { parseStoryboardSpec, parseTimestamp, type StoryboardSpec } from "@/lib/youtube/storyboard";

interface SpriteFrameProps {
  videoId: string;
  timestamp: string;
  className?: string;
}

// Module-level cache
const specCache = new Map<string, StoryboardSpec | null>();
const specPromises = new Map<string, Promise<StoryboardSpec | null>>();

/**
 * Fetch storyboard spec via our API proxy. Falls back gracefully
 * if YouTube blocks the request (common from cloud IPs).
 */
async function fetchSpec(videoId: string): Promise<StoryboardSpec | null> {
  if (specCache.has(videoId)) return specCache.get(videoId)!;

  if (!specPromises.has(videoId)) {
    specPromises.set(videoId, (async () => {
      try {
        const res = await fetch(`/api/youtube-storyboard?videoId=${videoId}`);
        if (!res.ok) {
          specCache.set(videoId, null);
          return null;
        }
        const data = await res.json();
        if (!data.baseUrl || !data.sizes?.length) {
          specCache.set(videoId, null);
          return null;
        }
        // Reconstruct spec string from API response
        const specStr = data.baseUrl + '|' + data.sizes.map((s: any) =>
          `${s.width}#${s.height}#0#${s.cols}#${s.rows}#${s.intervalMs}#${s.name}#${s.sigh}`
        ).join('|');
        const spec = parseStoryboardSpec(specStr);
        specCache.set(videoId, spec);
        return spec;
      } catch {
        specCache.set(videoId, null);
        return null;
      } finally {
        specPromises.delete(videoId);
      }
    })());
  }

  return specPromises.get(videoId)!;
}

export function SpriteFrame({ videoId, timestamp, className = "" }: SpriteFrameProps) {
  const [frameData, setFrameData] = useState<{
    url: string; x: number; y: number; width: number; height: number;
    cols: number; rows: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const spec = await fetchSpec(videoId);
      if (cancelled || !spec || !spec.sizes.length) { setLoading(false); return; }

      const size = spec.sizes[0];
      const seconds = parseTimestamp(timestamp);
      const intervalSec = size.intervalMs / 1000;
      if (intervalSec <= 0) { setLoading(false); return; }

      const framesPerSheet = size.cols * size.rows;
      const frameIndex = Math.floor(seconds / intervalSec);
      const sheetNumber = Math.floor(frameIndex / framesPerSheet);
      const indexInSheet = frameIndex % framesPerSheet;
      const row = Math.floor(indexInSheet / size.cols);
      const col = indexInSheet % size.cols;

      const url = spec.baseUrl
        .replace('$L', '0')
        .replace('$N', size.name)
        .replace('$M', String(sheetNumber));

      if (!cancelled) {
        setFrameData({
          url, x: col * size.width, y: row * size.height,
          width: size.width, height: size.height,
          cols: size.cols, rows: size.rows,
        });
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [videoId, timestamp]);

  if (loading) {
    return (
      <div className={`bg-gray-800/50 rounded animate-pulse ${className}`}
        style={{ width: 120, height: 68 }}
      />
    );
  }

  if (!frameData) return null;

  return (
    <div
      className={`rounded overflow-hidden flex-shrink-0 border border-gray-700 ${className}`}
      style={{
        width: frameData.width,
        height: frameData.height,
        backgroundImage: `url(${frameData.url})`,
        backgroundPosition: `-${frameData.x}px -${frameData.y}px`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${frameData.cols * frameData.width}px ${frameData.rows * frameData.height}px`,
      }}
      title={`Frame at ${timestamp}`}
    />
  );
}
