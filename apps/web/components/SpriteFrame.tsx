"use client";

import { useState } from "react";

interface SpriteFrameProps {
  videoId: string;
  timestamp: string;
  className?: string;
}

/**
 * Shows a YouTube video thumbnail as a frame preview.
 *
 * YouTube's storyboard sprite sheets require signed URLs that can't be
 * fetched from cloud infrastructure (YouTube blocks server-side requests).
 * Instead, we use the standard video thumbnail which is always publicly
 * available. Shows the timestamp as an overlay badge.
 */
export function SpriteFrame({ videoId, timestamp, className = "" }: SpriteFrameProps) {
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div
      className={`relative rounded overflow-hidden flex-shrink-0 border border-gray-700 ${className}`}
      style={{ width: 120, height: 68 }}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
        alt={`Frame at ${timestamp}`}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[9px] text-gray-300 px-1 rounded font-mono">
        {timestamp}
      </span>
    </div>
  );
}
