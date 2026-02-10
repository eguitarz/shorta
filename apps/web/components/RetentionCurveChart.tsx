"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import type { RetentionCurvePoint } from "@/lib/youtube/types";

interface Beat {
  beatNumber: number;
  startTime: number;
}

interface RetentionCurveChartProps {
  curveData: RetentionCurvePoint[];
  videoDuration: number;
  beats: Beat[];
  isFresh: boolean;
  fetchedAt: string;
  onRefresh: () => void;
  refreshing: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RetentionCurveChart({
  curveData,
  videoDuration,
  beats,
  isFresh,
  fetchedAt,
  onRefresh,
  refreshing,
}: RetentionCurveChartProps) {
  const t = useTranslations("analyzer.retentionCurve");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!curveData || curveData.length === 0) return null;

  const width = 600;
  const height = 220;
  const padLeft = 40;
  const padRight = 10;
  const padTop = 16;
  const padBottom = 28; // extra room for x-axis labels
  const chartWidth = width - padLeft - padRight;
  const usableHeight = height - padTop - padBottom;

  // Dynamic Y-axis max: at least 100%, but expand to fit data (shorts can exceed 100%)
  const maxWatch = Math.max(...curveData.map((p) => p.watchRatio));
  const yMax = maxWatch > 1.0 ? Math.ceil(maxWatch * 10) / 10 : 1.0; // e.g. 1.5 for 150%

  // Compute point coordinates for watch ratio line
  const watchPoints = curveData.map((p, i) => ({
    x: padLeft + (i / (curveData.length - 1)) * chartWidth,
    y: padTop + usableHeight - (p.watchRatio / yMax) * usableHeight,
  }));

  // Compute point coordinates for relative performance line
  const maxRelPerf = Math.max(...curveData.map((p) => p.relativePerformance), 2);
  const relScale = Math.max(maxRelPerf, 1.5); // ensure 1.0 baseline is visible

  const relPoints = curveData.map((p, i) => ({
    x: padLeft + (i / (curveData.length - 1)) * chartWidth,
    y:
      padTop +
      usableHeight -
      (p.relativePerformance / relScale) * usableHeight,
  }));

  // SVG paths
  const watchLinePath = `M ${watchPoints
    .map((p) => `${p.x},${p.y}`)
    .join(" L ")}`;
  const watchAreaPath = `${watchLinePath} L ${padLeft + chartWidth},${
    padTop + usableHeight
  } L ${padLeft},${padTop + usableHeight} Z`;

  const relLinePath = `M ${relPoints
    .map((p) => `${p.x},${p.y}`)
    .join(" L ")}`;

  // Y-axis labels — dynamic based on yMax
  const yLabels: { label: string; y: number }[] = [];
  const yStep = 0.5; // 50% steps
  for (let v = 0; v <= yMax + 0.001; v += yStep) {
    yLabels.push({
      label: `${Math.round(v * 100)}%`,
      y: padTop + usableHeight - (v / yMax) * usableHeight,
    });
  }

  // 1.0x reference line for relative performance
  const refLineY =
    padTop + usableHeight - (1.0 / relScale) * usableHeight;

  // X-axis time labels
  const xLabelCount = Math.min(6, Math.floor(videoDuration / 5) + 1);
  const xStep = videoDuration / (xLabelCount - 1 || 1);
  const xLabels: { label: string; x: number }[] = [];
  for (let i = 0; i < xLabelCount; i++) {
    const sec = Math.round(xStep * i);
    xLabels.push({
      label: `${sec}s`,
      x: padLeft + (sec / videoDuration) * chartWidth,
    });
  }

  // Beat markers as vertical lines
  const beatMarkers = beats
    .filter((b) => videoDuration > 0)
    .map((b) => ({
      beatNumber: b.beatNumber,
      x: padLeft + (b.startTime / videoDuration) * chartWidth,
    }))
    .filter((m) => m.x >= padLeft && m.x <= padLeft + chartWidth);

  // Find which beat contains the hovered point
  const getHoverBeat = (ratio: number): number | null => {
    const time = ratio * videoDuration;
    for (let i = beats.length - 1; i >= 0; i--) {
      if (time >= beats[i].startTime) return beats[i].beatNumber;
    }
    return null;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            {t("title")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isFresh && (
            <span className="text-xs text-yellow-500/80 bg-yellow-500/10 px-2 py-0.5 rounded">
              {t("stale")}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            title={t("refresh")}
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-400 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-orange-500 inline-block rounded" />
          {t("watchRatio")}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 inline-block rounded"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgb(59,130,246) 0, rgb(59,130,246) 3px, transparent 3px, transparent 6px)",
            }}
          />
          {t("relativePerformance")}
        </span>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="rgb(249,115,22)"
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor="rgb(249,115,22)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines */}
          {yLabels.map(({ label, y }) => (
            <g key={label}>
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-gray-500"
                fontSize="9"
              >
                {label}
              </text>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="rgb(55,65,81)"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            </g>
          ))}

          {/* 1.0x reference line for relative performance */}
          <line
            x1={padLeft}
            y1={refLineY}
            x2={width - padRight}
            y2={refLineY}
            stroke="rgb(59,130,246)"
            strokeWidth="0.5"
            strokeDasharray="2 4"
            opacity="0.4"
          />
          <text
            x={width - padRight + 2}
            y={refLineY + 3}
            className="fill-blue-400"
            fontSize="7"
            opacity="0.6"
          >
            1.0x
          </text>

          {/* X-axis time labels */}
          {xLabels.map(({ label, x }) => (
            <text
              key={label}
              x={x}
              y={padTop + usableHeight + 12}
              textAnchor="middle"
              className="fill-gray-500"
              fontSize="8"
            >
              {label}
            </text>
          ))}

          {/* Beat markers */}
          {beatMarkers.map((m) => (
            <g key={m.beatNumber}>
              <line
                x1={m.x}
                y1={padTop}
                x2={m.x}
                y2={padTop + usableHeight}
                stroke="rgb(107,114,128)"
                strokeWidth="0.5"
                strokeDasharray="3 3"
                opacity="0.5"
              />
              <text
                x={m.x}
                y={padTop + usableHeight + 22}
                textAnchor="middle"
                className="fill-gray-400"
                fontSize="7"
              >
                Beat {m.beatNumber}
              </text>
            </g>
          ))}

          {/* Watch ratio area + line */}
          <path d={watchAreaPath} fill="url(#retentionGrad)" />
          <path
            d={watchLinePath}
            fill="none"
            stroke="rgb(249,115,22)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Relative performance dashed line */}
          <path
            d={relLinePath}
            fill="none"
            stroke="rgb(59,130,246)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />

          {/* Hover vertical line */}
          {hoverIndex !== null && (
            <line
              x1={watchPoints[hoverIndex].x}
              y1={padTop}
              x2={watchPoints[hoverIndex].x}
              y2={padTop + usableHeight}
              stroke="rgb(156,163,175)"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Hover dots */}
          {hoverIndex !== null && (
            <>
              <circle
                cx={watchPoints[hoverIndex].x}
                cy={watchPoints[hoverIndex].y}
                r="3"
                fill="rgb(249,115,22)"
                stroke="white"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={relPoints[hoverIndex].x}
                cy={relPoints[hoverIndex].y}
                r="3"
                fill="rgb(59,130,246)"
                stroke="white"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}

          {/* Invisible hit areas */}
          {watchPoints.map((p, i) => (
            <rect
              key={i}
              x={p.x - chartWidth / curveData.length / 2}
              y={0}
              width={chartWidth / curveData.length}
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
              left: `${(watchPoints[hoverIndex].x / width) * 100}%`,
              top: `${(watchPoints[hoverIndex].y / height) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <p className="text-xs text-gray-400">
              {t("atTime", {
                time: formatTime(curveData[hoverIndex].ratio * videoDuration),
              })}
            </p>
            <p className="text-sm font-semibold text-orange-400">
              {(curveData[hoverIndex].watchRatio * 100).toFixed(1)}%{" "}
              <span className="text-xs text-gray-400 font-normal">
                {t("watchRatio")}
              </span>
            </p>
            <p className="text-sm text-blue-400">
              {curveData[hoverIndex].relativePerformance.toFixed(2)}x{" "}
              <span className="text-xs text-gray-400 font-normal">
                {curveData[hoverIndex].relativePerformance >= 1.0
                  ? t("aboveAverage")
                  : t("belowAverage")}
              </span>
            </p>
            {(() => {
              const beatNum = getHoverBeat(curveData[hoverIndex].ratio);
              return beatNum !== null ? (
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("beat", { number: beatNum })}
                </p>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
