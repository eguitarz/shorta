"use client";

import { useEffect, useState } from "react";
import { getFrameAtTimestamp, parseTimestamp, type FrameLocation } from "@/lib/youtube/storyboard";

interface StoryboardData {
  baseUrl: string;
  sizes: Array<{
    width: number;
    height: number;
    cols: number;
    rows: number;
    intervalMs: number;
    name: string;
    sigh: string;
  }>;
}

interface SpriteFrameProps {
  videoId: string;
  timestamp: string; // e.g. "0:03" or "2:30"
  className?: string;
}

// Module-level cache so multiple SpriteFrame instances on the same page
// don't re-fetch the storyboard spec for the same video.
const specCache = new Map<string, StoryboardData | null>();
const specPromises = new Map<string, Promise<StoryboardData | null>>();

async function fetchSpec(videoId: string): Promise<StoryboardData | null> {
  if (specCache.has(videoId)) return specCache.get(videoId)!;

  if (!specPromises.has(videoId)) {
    specPromises.set(videoId, (async () => {
      try {
        const res = await fetch(`/api/youtube-storyboard?videoId=${videoId}`);
        if (!res.ok) { specCache.set(videoId, null); return null; }
        const data = await res.json();
        specCache.set(videoId, data);
        return data;
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

/**
 * Renders a single frame from YouTube's storyboard sprite sheets.
 *
 * Uses CSS background-position to crop the correct tile from the
 * sprite sheet grid. YouTube hosts the images. Zero storage cost.
 */
export function SpriteFrame({ videoId, timestamp, className = "" }: SpriteFrameProps) {
  const [frame, setFrame] = useState<(FrameLocation & { cols: number; rows: number }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const data = await fetchSpec(videoId);
      if (cancelled || !data || !data.sizes.length) { setLoading(false); return; }

      const size = data.sizes[0]; // Best quality
      const seconds = parseTimestamp(timestamp);
      const intervalSec = size.intervalMs / 1000;
      const framesPerSheet = size.cols * size.rows;

      const frameIndex = Math.floor(seconds / intervalSec);
      const sheetNumber = Math.floor(frameIndex / framesPerSheet);
      const indexInSheet = frameIndex % framesPerSheet;
      const row = Math.floor(indexInSheet / size.cols);
      const col = indexInSheet % size.cols;

      const url = data.baseUrl
        .replace('$L', '0')
        .replace('$N', size.name)
        .replace('$M', String(sheetNumber));

      setFrame({
        url,
        x: col * size.width,
        y: row * size.height,
        width: size.width,
        height: size.height,
        cols: size.cols,
        rows: size.rows,
      });
      setLoading(false);
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

  if (!frame) return null; // Graceful degradation

  return (
    <div
      className={`rounded overflow-hidden flex-shrink-0 border border-gray-700 ${className}`}
      style={{
        width: frame.width,
        height: frame.height,
        backgroundImage: `url(${frame.url})`,
        backgroundPosition: `-${frame.x}px -${frame.y}px`,
        backgroundRepeat: 'no-repeat',
        // The sprite sheet is cols*width wide and rows*height tall
        backgroundSize: `${frame.cols * frame.width}px ${frame.rows * frame.height}px`,
      }}
      title={`Frame at ${timestamp}`}
    />
  );
}
