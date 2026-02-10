"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Video,
  BarChart3,
  Youtube,
  Target,
  Lightbulb,
  Clock,
  BookOpen,
  Heart,
  Play,
  Lock,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ChannelAnalytics, MetricChange, ChannelVideoSummary, MonetizationAnalysis, RetentionMetrics } from "@/lib/youtube/types";

function MetricCard({
  label,
  change,
  icon: Icon,
  format = "number",
}: {
  label: string;
  change: MetricChange;
  icon: React.ElementType;
  format?: "number" | "compact" | "percent";
}) {
  const hasPrevious = change.previous !== null;
  const isPositive = (change.delta ?? 0) > 0;
  const isNegative = (change.delta ?? 0) < 0;

  const formatValue = (val: number) => {
    if (format === "percent") return `${val.toFixed(1)}%`;
    if (format === "compact") {
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {formatValue(change.current)}
      </div>
      {hasPrevious ? (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          ) : isNegative ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          ) : null}
          <span
            className={`text-sm font-medium ${
              isPositive
                ? "text-green-500"
                : isNegative
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {isPositive ? "+" : ""}
            {change.delta?.toLocaleString()}
          </span>
          {change.percentChange !== null && (
            <span className="text-xs text-gray-500">
              ({isPositive ? "+" : ""}
              {change.percentChange.toFixed(1)}%)
            </span>
          )}
          <span className="text-xs text-gray-600 ml-1">vs 7d ago</span>
        </div>
      ) : (
        <span className="text-xs text-gray-600">Not enough data yet</span>
      )}
    </div>
  );
}

function GrowthChart({
  snapshots,
  t,
}: {
  snapshots: ChannelAnalytics["historicalSnapshots"];
  t: ReturnType<typeof useTranslations>;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!snapshots || snapshots.length < 2) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {t("growthChart")}
        </h3>
        <p className="text-gray-500 text-sm text-center py-4">
          {t("growthChartEmpty")}
        </p>
      </div>
    );
  }

  const values = snapshots.map((s) => s.subscriber_count);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const mid = Math.round(min + range / 2);

  const formatLabel = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  const padLeft = 50;
  const width = 600;
  const chartWidth = width - padLeft;
  const height = 140;
  const padY = 14;
  const usableHeight = height - padY * 2;

  const pointCoords = values.map((v, i) => {
    const x = padLeft + (i / (values.length - 1)) * chartWidth;
    const y = padY + usableHeight - ((v - min) / range) * usableHeight;
    return { x, y };
  });

  const linePath = `M ${pointCoords.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const areaPath = `${linePath} L ${padLeft + chartWidth},${height} L ${padLeft},${height} Z`;

  const yLabelPositions = [
    { value: max, y: padY },
    { value: mid, y: padY + usableHeight / 2 },
    { value: min, y: padY + usableHeight },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        {t("growthChart")}
      </h3>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis labels */}
          {yLabelPositions.map(({ value, y }) => (
            <g key={value}>
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-500"
                fontSize="10"
              >
                {formatLabel(value)}
              </text>
              <line
                x1={padLeft}
                y1={y}
                x2={width}
                y2={y}
                stroke="rgb(55,65,81)"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            </g>
          ))}

          {/* Chart area and line */}
          <path d={areaPath} fill="url(#chartGrad)" />
          <path
            d={linePath}
            fill="none"
            stroke="rgb(59,130,246)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Hover vertical line */}
          {hoverIndex !== null && (
            <line
              x1={pointCoords[hoverIndex].x}
              y1={padY}
              x2={pointCoords[hoverIndex].x}
              y2={height}
              stroke="rgb(156,163,175)"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Hover dot */}
          {hoverIndex !== null && (
            <circle
              cx={pointCoords[hoverIndex].x}
              cy={pointCoords[hoverIndex].y}
              r="4"
              fill="rgb(59,130,246)"
              stroke="white"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Invisible hit areas for each data point */}
          {pointCoords.map((p, i) => (
            <rect
              key={i}
              x={p.x - chartWidth / values.length / 2}
              y={0}
              width={chartWidth / values.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoverIndex !== null && (
          <div
            className="absolute pointer-events-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg z-10"
            style={{
              left: `${(pointCoords[hoverIndex].x / width) * 100}%`,
              top: `${(pointCoords[hoverIndex].y / height) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <p className="text-xs text-gray-400">
              {snapshots[hoverIndex].snapshot_date}
            </p>
            <p className="text-sm font-semibold text-white">
              {values[hoverIndex].toLocaleString()} {t("subscribers")}
            </p>
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{snapshots[0].snapshot_date}</span>
        <span>{snapshots[snapshots.length - 1].snapshot_date}</span>
      </div>
    </div>
  );
}

function CompletionBadge({
  percentage,
  durationSeconds,
}: {
  percentage: number;
  durationSeconds?: number | null;
}) {
  const t = useTranslations("channel");
  const color =
    percentage >= 70
      ? "bg-green-500/10 text-green-500"
      : percentage >= 40
      ? "bg-yellow-500/10 text-yellow-500"
      : "bg-red-500/10 text-red-500";

  const tooltip = t("retention.completionTooltip");
  const titleText = durationSeconds
    ? `${tooltip}\n${t("retention.avgDuration", { seconds: durationSeconds })}`
    : tooltip;

  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium cursor-default ${color}`}
      title={titleText}
    >
      {percentage.toFixed(0)}%
    </span>
  );
}

function ShortItem({ short }: { short: ChannelVideoSummary }) {
  const content = (
    <div className="flex items-center gap-3">
      {short.thumbnail_url ? (
        <img
          src={short.thumbnail_url}
          alt=""
          className="w-16 h-9 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-9 rounded bg-gray-800 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">
          {short.title || "Untitled"}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {short.view_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {short.like_count.toLocaleString()}
          </span>
          {short.avg_view_percentage != null && (
            <CompletionBadge percentage={short.avg_view_percentage} durationSeconds={short.avg_view_duration_seconds} />
          )}
        </div>
      </div>
    </div>
  );

  if (short.analysis_job_id) {
    return (
      <Link
        href={`/analyzer/${short.analysis_job_id}`}
        className="block hover:bg-gray-800/50 rounded-lg p-2 -m-2 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return <div className="p-2 -m-2">{content}</div>;
}

function getMarketSizeColor(size: MonetizationAnalysis['marketSize']) {
  switch (size) {
    case 'small': return 'bg-blue-400/10 text-blue-400';
    case 'medium': return 'bg-cyan-400/10 text-cyan-400';
    case 'large': return 'bg-emerald-400/10 text-emerald-400';
    case 'massive': return 'bg-green-400/10 text-green-400';
  }
}

function getCompetitionColor(level: MonetizationAnalysis['competitionLevel']) {
  switch (level) {
    case 'low': return 'bg-green-500/10 text-green-500';
    case 'medium': return 'bg-yellow-500/10 text-yellow-500';
    case 'high': return 'bg-orange-500/10 text-orange-500';
    case 'saturated': return 'bg-red-500/10 text-red-500';
  }
}

function getGrowthColor(growth: MonetizationAnalysis['growthPotential']) {
  switch (growth) {
    case 'declining': return 'bg-red-500/10 text-red-500';
    case 'stable': return 'bg-yellow-500/10 text-yellow-500';
    case 'growing': return 'bg-emerald-500/10 text-emerald-500';
    case 'explosive': return 'bg-green-500/10 text-green-500';
  }
}

function MonetizationReview({
  analysis,
  t,
}: {
  analysis: MonetizationAnalysis;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          {t("monetization.title")}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
          {Math.round(analysis.overallConfidence * 100)}% {t("confidence")}
        </span>
      </div>

      {/* Confidence reasoning */}
      <p className="text-xs text-gray-500 mb-5">{analysis.confidenceReasoning}</p>

      {/* 3 Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Market Size */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {t("monetization.marketSize")}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getMarketSizeColor(analysis.marketSize)}`}>
              {t(`monetization.levels.${analysis.marketSize}`)}
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {analysis.marketSizeReasoning}
          </p>
        </div>

        {/* Competition */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {t("monetization.competition")}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCompetitionColor(analysis.competitionLevel)}`}>
              {t(`monetization.levels.${analysis.competitionLevel}`)}
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {analysis.competitionReasoning}
          </p>
        </div>

        {/* Growth Potential */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {t("monetization.growthPotential")}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getGrowthColor(analysis.growthPotential)}`}>
              {t(`monetization.levels.${analysis.growthPotential}`)}
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {analysis.growthPotentialReasoning}
          </p>
        </div>
      </div>

      {/* Revenue Estimates */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-5">
        <span className="text-xs text-gray-500 uppercase tracking-wider block mb-3">
          {t("monetization.revenueEstimate")}
        </span>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-500 block mb-1">
              {t("monetization.cpmRange")}
            </span>
            <span className="text-lg font-semibold text-white">
              ${analysis.estimatedCpmRange.low.toFixed(2)} – ${analysis.estimatedCpmRange.high.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">
              {t("monetization.monthlyRevenue")}
            </span>
            <span className="text-lg font-semibold text-white">
              ${analysis.monthlyRevenueEstimate.low.toLocaleString()} – ${analysis.monthlyRevenueEstimate.high.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Monetization Strategies */}
      {analysis.monetizationStrategies?.length > 0 && (
        <div className="mb-5">
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
            {t("monetization.strategies")}
          </span>
          <ol className="list-decimal list-inside space-y-1.5">
            {analysis.monetizationStrategies.map((strategy, i) => (
              <li key={i} className="text-sm text-gray-300 leading-relaxed">
                {strategy}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Recommendation */}
      {analysis.recommendation && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs text-yellow-500 uppercase tracking-wider font-semibold">
              {t("monetization.recommendation")}
            </span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {analysis.recommendation}
          </p>
        </div>
      )}

      {/* Niche Advice */}
      {analysis.nicheAdvice && (
        <div className="pt-4 border-t border-gray-800">
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
            {t("monetization.nicheAdvice")}
          </span>
          <p className="text-sm text-gray-400 leading-relaxed">
            {analysis.nicheAdvice}
          </p>
        </div>
      )}
    </div>
  );
}

function RetentionShortItem({ short: s }: { short: ChannelVideoSummary }) {
  const content = (
    <div className="flex items-center gap-3">
      {s.thumbnail_url ? (
        <img
          src={s.thumbnail_url}
          alt=""
          className="w-14 h-8 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-8 rounded bg-gray-800 flex-shrink-0" />
      )}
      <p className="text-sm text-white truncate flex-1 min-w-0">
        {s.title || "Untitled"}
      </p>
      {s.avg_view_percentage != null && (
        <CompletionBadge
          percentage={s.avg_view_percentage}
          durationSeconds={s.avg_view_duration_seconds}
        />
      )}
    </div>
  );

  if (s.analysis_job_id) {
    return (
      <Link
        href={`/analyzer/${s.analysis_job_id}`}
        className="block hover:bg-gray-800/50 rounded-lg p-2 -m-2 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return <div className="p-2 -m-2">{content}</div>;
}

function RetentionOverview({
  metrics,
  t,
}: {
  metrics: RetentionMetrics;
  t: ReturnType<typeof useTranslations>;
}) {
  const rateColor =
    metrics.avgCompletionRate !== null && metrics.avgCompletionRate >= 70
      ? "text-green-500"
      : metrics.avgCompletionRate !== null && metrics.avgCompletionRate >= 40
      ? "text-yellow-500"
      : "text-red-500";

  const rateBgColor =
    metrics.avgCompletionRate !== null && metrics.avgCompletionRate >= 70
      ? "bg-green-500/10"
      : metrics.avgCompletionRate !== null && metrics.avgCompletionRate >= 40
      ? "bg-yellow-500/10"
      : "bg-red-500/10";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-5 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        {t("retention.title")}
      </h3>

      {/* Summary bar */}
      <div className={`${rateBgColor} rounded-lg p-4 mb-6 flex items-center gap-4`}>
        <span
          className={`text-3xl font-bold ${rateColor}`}
          title={t("retention.completionTooltip")}
        >
          {metrics.avgCompletionRate !== null
            ? `${metrics.avgCompletionRate.toFixed(1)}%`
            : "—"}
        </span>
        <div>
          <p className="text-sm text-gray-300 font-medium">
            {t("retention.avgCompletionRate")}
          </p>
          <p className="text-xs text-gray-500">
            {t("retention.acrossShorts", { count: metrics.totalShortsWithData })}
          </p>
        </div>
      </div>

      {/* Top / Bottom side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Retention */}
        {metrics.topRetention.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-3">
              {t("retention.bestPerforming")}
            </span>
            <div className="space-y-3">
              {metrics.topRetention.map((short) => (
                <RetentionShortItem key={short.youtube_video_id} short={short} />
              ))}
            </div>
          </div>
        )}

        {/* Lowest Retention */}
        {metrics.lowestRetention.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-3">
              {t("retention.lowestPerforming")}
            </span>
            <div className="space-y-3">
              {metrics.lowestRetention.map((short) => (
                <RetentionShortItem key={short.youtube_video_id} short={short} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function ChannelContent() {
  const t = useTranslations("channel");
  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const syncTriggered = useRef(false);

  const fetchAnalytics = async () => {
    const res = await fetch("/api/youtube/channel-analytics");
    const data = await res.json();
    if (!data.error) setAnalytics(data);
    return data;
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await fetch("/api/youtube/sync-videos?force=true", { method: "POST" });
      await fetchAnalytics();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Capture today's snapshot
    fetch("/api/youtube/capture-snapshot", { method: "POST" }).catch(() => {});

    // Fetch analytics, then light-sync + auto-sync if stale
    fetchAnalytics()
      .then((data) => {
        if (!data.error && data.connection?.connected) {
          // 1. Always run light-sync (fast, ~0 quota) to detect new videos
          fetch("/api/youtube/light-sync", { method: "POST" })
            .then((res) => res.json())
            .then((result) => {
              if (result.synced > 0) {
                // New videos found — refresh analytics to update UI
                fetchAnalytics();
              }
            })
            .catch(console.error);

          // 2. Full sync only if stale (>24h) — existing behavior
          if (!syncTriggered.current) {
            const lastSync = data.connection.lastVideoSync;
            const isStale = !lastSync || Date.now() - new Date(lastSync).getTime() > ONE_DAY_MS;
            if (isStale) {
              syncTriggered.current = true;
              fetch("/api/youtube/sync-videos", { method: "POST" })
                .then(() => fetchAnalytics())
                .catch(console.error);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <header className="h-16 border-b border-gray-800 flex items-center px-6">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">{t("loading")}</div>
        </main>
      </div>
    );
  }

  // Empty state: no YouTube connected
  if (!analytics?.connection?.connected) {
    return (
      <div className="flex flex-col h-full">
        <header className="h-16 border-b border-gray-800 flex items-center px-6">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Youtube className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("connectTitle")}</h2>
            <p className="text-gray-400 mb-6">{t("connectDescription")}</p>
            <Link href="/api/auth/youtube/initiate">
              <Button className="bg-red-600 hover:bg-red-700">
                <Youtube className="w-4 h-4 mr-2" />
                {t("connectButton")}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { connection, profile, stats, weekOverWeekChanges, historicalSnapshots, topShorts, unanalyzedShorts, retentionMetrics } =
    analytics;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center px-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Channel Header */}
        <div className="flex items-center gap-4">
          {connection?.channelThumbnail ? (
            <img
              src={connection.channelThumbnail}
              alt=""
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">
              {connection?.channelTitle || "My Channel"}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>
                {(connection?.subscriberCount || 0).toLocaleString()}{" "}
                {t("subscribers")}
              </span>
              {connection?.lastVideoSync && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t("lastSync")}{" "}
                  {new Date(connection.lastVideoSync).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncNow}
            disabled={syncing}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? t("syncing") : t("syncNow")}
          </Button>
        </div>

        {/* Week-over-Week Change Cards */}
        {weekOverWeekChanges ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label={t("metrics.subscribers")}
              change={weekOverWeekChanges.subscribers}
              icon={Users}
            />
            <MetricCard
              label={t("metrics.totalViews")}
              change={weekOverWeekChanges.totalViews}
              icon={Eye}
              format="compact"
            />
            <MetricCard
              label={t("metrics.avgShortViews")}
              change={weekOverWeekChanges.avgShortViews}
              icon={BarChart3}
              format="compact"
            />
            <MetricCard
              label={t("metrics.engagementRate")}
              change={weekOverWeekChanges.engagementRate}
              icon={Heart}
              format="percent"
            />
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">{t("notEnoughData")}</p>
            <p className="text-gray-600 text-xs mt-1">
              {t("notEnoughDataHint")}
            </p>
          </div>
        )}

        {/* Growth Chart & Channel Stats — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GrowthChart snapshots={historicalSnapshots} t={t} />

          {/* Channel Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Video className="w-4 h-4" />
              {t("channelStats")}
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <span className="text-2xl font-bold text-white">
                  {stats.totalVideos}
                </span>
                <span className="text-sm text-gray-500 block">
                  {t("stats.totalVideos")}
                </span>
              </div>
              <div>
                <span className="text-2xl font-bold text-white">
                  {stats.shortsCount}
                </span>
                <span className="text-sm text-gray-500 block">
                  {t("stats.shorts")}
                </span>
              </div>
              <div>
                <span className="text-2xl font-bold text-white">
                  {stats.analyzedCount}
                </span>
                <span className="text-sm text-gray-500 block">
                  {t("stats.analyzed")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Niche Analysis */}
        {profile ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              {t("nicheAnalysis")}
            </h3>
            <div className="space-y-4">
              {/* Primary Niche */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-semibold text-white">
                    {profile.primary_niche || "—"}
                  </span>
                  {profile.niche_confidence && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                      {Math.round(profile.niche_confidence * 100)}%{" "}
                      {t("confidence")}
                    </span>
                  )}
                </div>
              </div>

              {/* Secondary Niches */}
              {profile.secondary_niches?.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    {t("secondaryNiches")}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.secondary_niches.map((n: string) => (
                      <span
                        key={n}
                        className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                {profile.target_audience && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                      {t("targetAudience")}
                    </span>
                    <span className="text-sm text-white">
                      {profile.target_audience}
                    </span>
                  </div>
                )}
                {profile.primary_format && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                      {t("format")}
                    </span>
                    <span className="text-sm text-white capitalize">
                      {profile.primary_format.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Content Themes */}
              {profile.content_themes?.length > 0 && (
                <div className="pt-2 border-t border-gray-800">
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                    {t("contentThemes")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.content_themes.map((theme: string) => (
                      <span
                        key={theme}
                        className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasoning */}
              {profile.niche_reasoning && (
                <div className="pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {t("reasoning")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {profile.niche_reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              {t("nicheAnalysis")}
            </h3>
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-white font-medium mb-1">
                {t("nicheEmpty.title")}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {t("nicheEmpty.description")}
              </p>
              <Link href="/blog/2026-02-07-start-youtube-channel-hands-on-guide">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t("nicheEmpty.blogLink")}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Monetization Review */}
        {profile?.monetization_analysis && (
          <MonetizationReview analysis={profile.monetization_analysis} t={t} />
        )}

        {/* Retention Overview */}
        {retentionMetrics && retentionMetrics.totalShortsWithData > 0 && (
          <RetentionOverview metrics={retentionMetrics} t={t} />
        )}

        {/* Top Performing Shorts & Unanalyzed Shorts — side by side */}
        {((topShorts && topShorts.length > 0) || (unanalyzedShorts && unanalyzedShorts.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Performing Shorts */}
            {topShorts && topShorts.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t("topShorts")}
                </h3>
                <div className="space-y-3">
                  {topShorts.map((short) => (
                    <ShortItem key={short.youtube_video_id} short={short} />
                  ))}
                </div>
              </div>
            )}

            {/* Unanalyzed Shorts */}
            {unanalyzedShorts && unanalyzedShorts.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  {t("readyToAnalyze")}
                </h3>
                <div className="space-y-3">
                  {unanalyzedShorts.map((short) => {
                    const isPrivate = short.privacy_status !== "public";
                    const analyzeUrl = `/home?analyzeUrl=${encodeURIComponent(`https://youtube.com/shorts/${short.youtube_video_id}`)}`;
                    return (
                      <div
                        key={short.youtube_video_id}
                        className="flex items-center gap-3"
                      >
                        {short.thumbnail_url ? (
                          <img
                            src={short.thumbnail_url}
                            alt=""
                            className="w-16 h-9 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-9 rounded bg-gray-800 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {short.title || "Untitled"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {short.published_at
                              ? new Date(short.published_at).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                        {isPrivate ? (
                          <span
                            className="flex items-center gap-1 text-xs text-gray-500 px-3 py-1.5 bg-gray-800 rounded cursor-default"
                            title={t("privateVideoTooltip")}
                          >
                            <Lock className="w-3 h-3" />
                            {t("privateVideo")}
                          </span>
                        ) : (
                          <Link href={analyzeUrl}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-700 text-gray-300 hover:text-white text-xs"
                            >
                              {t("analyzeButton")}
                            </Button>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
