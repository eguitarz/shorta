'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  LineChart,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';

type ChannelMetrics = {
  avgViews: number;
  medianViews: number;
  uploadsPerWeek: number;
  viewsPerMonth: number;
  engagementPer1k: number;
  consistencyScore: number;
  avgDurationSeconds: number;
  shortsShare: number;
};

type ChannelInfo = {
  id: string;
  title: string;
  handle?: string | null;
  url: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
};

type VideoInfo = {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  durationSeconds: number;
};

type ChannelReport = {
  channel: ChannelInfo;
  metrics: ChannelMetrics;
  videos: VideoInfo[];
  sampleSize: number;
  updatedAt: string;
};

export function YouTubeChannelAnalyzer() {
  const [input, setInput] = useState('');
  const [report, setReport] = useState<ChannelReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const example = useMemo(() => 'https://www.youtube.com/@AliAbdaal', []);

  const runAnalysis = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Enter a channel URL or @handle.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/channel-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to analyze this channel.');
      }
      setReport(data as ChannelReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await runAnalysis(input);
  };

  const handleExample = async () => {
    setInput(example);
    await runAnalysis(example);
  };

  return (
    <div className="not-prose">
      <div className="bg-gradient-to-r from-blue-500/10 via-transparent to-transparent border border-blue-500/20 rounded-2xl p-6 md:p-8 mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold">YouTube Data API</span>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">No AI</span>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Channel snapshot</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Analyze a YouTube Channel</h2>
        <p className="text-gray-400 mb-6">
          Get a fast, real-data snapshot of a channel’s momentum, cadence, and engagement.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste a channel URL or @handle"
            className="flex-1 rounded-lg border border-gray-700 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            aria-label="Channel URL or handle"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
            <TrendingUp className="w-4 h-4" />
          </button>
        </form>
        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
        <button
          type="button"
          onClick={handleExample}
          className="mt-4 text-sm text-blue-300 hover:text-blue-200 transition-colors"
        >
          Try an example channel
        </button>
      </div>

      {report && (
        <div className="space-y-10">
          <section className="bg-[#141414] border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-2">Channel Snapshot</p>
                <h3 className="text-2xl font-bold">{report.channel.title}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  {report.channel.handle ? `@${report.channel.handle.replace('@', '')}` : report.channel.url}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-lg font-semibold">{formatNumber(report.channel.subscribers)}</p>
                  <p className="text-xs text-gray-500">Subscribers</p>
                </div>
                <div>
                  <Eye className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-lg font-semibold">{formatNumber(report.channel.totalViews)}</p>
                  <p className="text-xs text-gray-500">Total Views</p>
                </div>
                <div>
                  <Video className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-lg font-semibold">{formatNumber(report.channel.videoCount)}</p>
                  <p className="text-xs text-gray-500">Videos</p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-xs text-gray-500">
              Sample size: {report.sampleSize} recent videos · Updated: {new Date(report.updatedAt).toLocaleString()}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4">Key Metrics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <MetricCard
                icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
                title="Average Views"
                value={formatNumber(report.metrics.avgViews)}
                description="Average views on the latest uploads."
              />
              <MetricCard
                icon={<LineChart className="w-5 h-5 text-indigo-400" />}
                title="Consistency Score"
                value={`${report.metrics.consistencyScore}/100`}
                description="Higher means steadier cadence + view stability."
              />
              <MetricCard
                icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                title="Uploads per Week"
                value={`${report.metrics.uploadsPerWeek}`}
                description="Based on the time span of recent uploads."
              />
              <MetricCard
                icon={<Eye className="w-5 h-5 text-orange-400" />}
                title="Views / Month (Proxy)"
                value={formatNumber(report.metrics.viewsPerMonth)}
                description="Estimated from recent video velocity."
              />
              <MetricCard
                icon={<CheckCircle2 className="w-5 h-5 text-purple-400" />}
                title="Engagement / 1K"
                value={`${report.metrics.engagementPer1k}`}
                description="Average likes per 1K views."
              />
              <MetricCard
                icon={<Clock className="w-5 h-5 text-rose-400" />}
                title="Shorts Share"
                value={`${report.metrics.shortsShare}%`}
                description="Share of recent uploads under 60 seconds."
              />
            </div>
          </section>

          <section className="bg-[#111111] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Videos (Free Preview)</h3>
            <div className="space-y-3">
              {report.videos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex items-center justify-between gap-4 border-b border-gray-800 pb-3">
                  <div>
                    <p className="font-medium">{video.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(video.publishedAt).toLocaleDateString()} · {formatNumber(video.views)} views
                    </p>
                  </div>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Paid tier unlocks the full 30-video breakdown, trend curves, and export.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  description,
}: {
  icon: ReactNode;
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString();
}
