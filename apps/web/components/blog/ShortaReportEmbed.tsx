'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/posthog';

interface ShortaReportEmbedProps {
  jobId: string;
  creatorName?: string;
  videoTitle?: string;
}

interface AnalysisData {
  url?: string;
  lintSummary?: {
    score: number;
    totalRules: number;
    passed: number;
    critical: number;
    moderate: number;
    minor: number;
  };
  storyboard?: {
    performance?: {
      hookEffectiveness?: string;
      structureScore?: string;
      clarityScore?: string;
      deliveryScore?: string;
    };
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500/10';
  if (score >= 60) return 'bg-orange-500/10';
  return 'bg-red-500/10';
}

function parseGrade(grade: string | undefined): number | null {
  if (!grade) return null;
  const match = grade.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function getYouTubeThumbnail(url: string | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
}

function SkeletonCard() {
  return (
    <div className="not-prose my-8 bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-[280px] aspect-video bg-gray-800 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-3 w-32 bg-gray-800 rounded" />
          <div className="h-10 w-20 bg-gray-800 rounded" />
          <div className="h-4 w-48 bg-gray-800 rounded" />
          <div className="h-3 w-36 bg-gray-800 rounded" />
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-6 w-20 bg-gray-800 rounded" />
        ))}
      </div>
      <div className="h-10 w-full bg-gray-800 rounded-lg mt-4" />
    </div>
  );
}

function ErrorCard() {
  return (
    <div className="not-prose my-8 bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
      <div className="text-center py-4">
        <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-gray-400 text-sm">Analysis report unavailable</p>
        <Link href="https://shorta.ai" className="text-blue-400 text-xs hover:underline mt-1 inline-block">
          Try Shorta →
        </Link>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  hook: 'text-orange-400',
  structure: 'text-blue-400',
  clarity: 'text-green-400',
  delivery: 'text-purple-400',
};

export function ShortaReportEmbed({ jobId, creatorName, videoTitle }: ShortaReportEmbedProps) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/share/${jobId}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const json = await res.json();
        setData(json.analysis);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [jobId]);

  if (loading) return <SkeletonCard />;
  if (error || !data) return <ErrorCard />;

  const score = data.lintSummary?.score ?? 0;
  const thumbnail = getYouTubeThumbnail(data.url);
  const performance = data.storyboard?.performance;

  const categories = [
    { name: 'Hook', score: parseGrade(performance?.hookEffectiveness), key: 'hook' },
    { name: 'Structure', score: parseGrade(performance?.structureScore), key: 'structure' },
    { name: 'Clarity', score: parseGrade(performance?.clarityScore), key: 'clarity' },
    { name: 'Delivery', score: parseGrade(performance?.deliveryScore), key: 'delivery' },
  ];

  return (
    <div className="not-prose my-8 bg-[#1a1a1a] border border-gray-800 rounded-lg p-6" role="article" aria-label={`Shorta analysis of ${videoTitle || 'video'}`}>
      {/* Header */}
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3 font-medium">
        Shorta AI Analysis
      </div>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Thumbnail */}
        {thumbnail && (
          <div className="w-full sm:w-[280px] shrink-0">
            <img
              src={thumbnail}
              alt={videoTitle || 'Video thumbnail'}
              className="w-full aspect-video rounded-lg object-cover"
            />
          </div>
        )}

        {/* Score + info */}
        <div className="flex-1 min-w-0">
          {/* Score */}
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className={`text-3xl font-bold font-heading ${getScoreColor(score)}`} aria-label={`Overall score: ${score} out of 100`}>
              {score}
            </span>
            <span className="text-gray-500 text-sm">/100</span>
            <div className={`ml-2 h-1.5 w-16 rounded-full bg-gray-800 overflow-hidden`}>
              <div className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
            </div>
          </div>

          {/* Video title + creator */}
          {videoTitle && (
            <p className="text-gray-200 text-sm font-medium truncate">{videoTitle}</p>
          )}
          {creatorName && (
            <p className="text-gray-400 text-xs mt-0.5">{creatorName}</p>
          )}
        </div>
      </div>

      {/* Category scores */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-gray-800">
        {categories.map(cat => (
          <div key={cat.key} className="flex items-center gap-1.5" aria-label={`${cat.name} score: ${cat.score ?? 'N/A'}`}>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">{cat.name}</span>
            <span className={`text-xs font-medium ${CATEGORY_COLORS[cat.key]}`}>
              {cat.score !== null ? cat.score : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={`/shared/${jobId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 w-full bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-500/20 hover:border-blue-500/50 transition-colors"
        aria-label={`View Full Analysis Report${videoTitle ? ` for ${videoTitle}` : ''}`}
        onClick={() => trackEvent('blog_report_link_clicked', {
          job_id: jobId,
          creator_name: creatorName,
          video_title: videoTitle,
        })}
      >
        View Full Analysis Report
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Link>
    </div>
  );
}
