'use client';

import { useState } from 'react';
import { Share2, Copy, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';

interface ShareButtonProps {
  jobId: string;
}

export function ShareButton({ jobId }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setSharing(true);
    setError(null);

    try {
      console.log('[ShareButton] Creating share link for job:', jobId);
      const response = await fetch(`/api/jobs/${jobId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log('[ShareButton] API response:', { status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to create share link';
        console.error('[ShareButton] API error:', errorMsg, data);
        throw new Error(errorMsg);
      }

      console.log('[ShareButton] Share URL created:', data.share_url);
      setShareUrl(data.share_url);
    } catch (err) {
      console.error('[ShareButton] Share error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      setError('Failed to copy link');
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg">
        <span className="text-sm text-red-400">{error}</span>
      </div>
    );
  }

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="bg-transparent text-sm text-gray-400 outline-none flex-1 min-w-0"
          onClick={(e) => e.currentTarget.select()}
        />
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="Copy link"
        >
          {copied ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
    >
      {sharing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-400">Generating...</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Share</span>
        </>
      )}
    </button>
  );
}
