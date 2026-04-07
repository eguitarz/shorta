"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/posthog";
import { NICHE_WEIGHTS } from "@/lib/scoring/constants";
import type { VideoFormat } from "@/lib/linter/types";
import { SpriteFrame } from "@/components/SpriteFrame";

export interface TopChange {
  change: string;
  category: "hook" | "structure" | "clarity" | "delivery";
  timestamp?: string;
  impact: "high" | "medium";
  reason: string;
}

interface FixListProps {
  topChanges?: TopChange[];
  performance?: {
    hookStrength: number;
    structurePacing: number;
    deliveryPerformance: number;
    hook: { analysis: string };
    structure: { analysis: string };
    content: { valueClarity: number; analysis: string };
    delivery: { analysis: string };
  };
  videoFormat?: string;
  videoId?: string; // YouTube video ID for storyboard frame previews
  onCardClick?: (timestamp?: string) => void;
  onCompareClick?: () => void;
  onShareClick?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  hook: "bg-orange-500/10 text-orange-400",
  structure: "bg-blue-500/10 text-blue-400",
  clarity: "bg-green-500/10 text-green-400",
  delivery: "bg-purple-500/10 text-purple-400",
};

function isValidTopChange(item: any): item is TopChange {
  return (
    item &&
    typeof item.change === "string" &&
    item.change.trim().length > 0 &&
    ["hook", "structure", "clarity", "delivery"].includes(item.category)
  );
}

function buildFallbackChanges(
  performance: FixListProps["performance"],
  videoFormat?: string
): TopChange[] {
  if (!performance) return [];

  const format = (videoFormat as VideoFormat) || "other";
  const weights = NICHE_WEIGHTS[format] || NICHE_WEIGHTS.other;

  const categories = [
    { key: "hook" as const, score: performance.hookStrength, weight: weights.hook, analysis: performance.hook?.analysis },
    { key: "structure" as const, score: performance.structurePacing, weight: weights.structure, analysis: performance.structure?.analysis },
    { key: "clarity" as const, score: performance.content?.valueClarity ?? 0, weight: weights.clarity, analysis: performance.content?.analysis },
    { key: "delivery" as const, score: performance.deliveryPerformance, weight: weights.delivery, analysis: performance.delivery?.analysis },
  ];

  // Weighted importance: higher weight + lower score = more important to fix
  const ranked = categories
    .map((c) => ({ ...c, importance: (100 - c.score) * c.weight }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3);

  return ranked.map((c) => ({
    change: c.analysis?.split("\n")[0] || `Improve your ${c.key} score`,
    category: c.key,
    impact: c.importance > 15 ? "high" as const : "medium" as const,
    reason: `Score: ${Math.round(c.score)}/100`,
  }));
}

export function FixList({
  topChanges,
  performance,
  videoFormat,
  videoId,
  onCardClick,
  onCompareClick,
  onShareClick,
}: FixListProps) {
  const t = useTranslations("analyzer.fixList");

  const validChanges = topChanges?.filter(isValidTopChange) ?? [];
  const isAI = validChanges.length > 0;
  const allHighScores = performance &&
    performance.hookStrength >= 80 &&
    performance.structurePacing >= 80 &&
    (performance.content?.valueClarity ?? 0) >= 80 &&
    performance.deliveryPerformance >= 80;

  const changes = isAI
    ? validChanges
    : buildFallbackChanges(performance, videoFormat);

  if (changes.length === 0) return null;

  const isPositiveState = !isAI && allHighScores;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-white">
          {isPositiveState ? t("positiveTitle") : t("title")}
        </h2>
        <div className="flex items-center gap-2">
          {onCompareClick && (
            <button
              onClick={onCompareClick}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-800"
            >
              {t("compare")}
            </button>
          )}
          {onShareClick && (
            <button
              onClick={onShareClick}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-800"
            >
              {t("share")}
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-gray-500 mb-4">
        {isPositiveState ? t("positiveSubtitle") : t("subtitle")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {changes.map((change, index) => {
          const clickable = !!change.timestamp && !!onCardClick;
          return (
            <div
              key={index}
              className={`bg-gray-900/50 border border-gray-800 rounded-lg p-3 ${
                clickable ? "cursor-pointer hover:border-gray-700 transition-colors" : ""
              }`}
              onClick={clickable ? () => {
                trackEvent('fix_list_card_clicked', { category: change.category, index });
                onCardClick(change.timestamp);
              } : undefined}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCardClick(change.timestamp); } } : undefined}
            >
              <div className="flex items-start gap-2.5">
                {isPositiveState ? (
                  <div className="w-6 h-6 bg-green-600/20 text-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${CATEGORY_COLORS[change.category] || "bg-gray-500/10 text-gray-400"}`}>
                      {t(`category.${change.category}`)}
                    </span>
                    {change.timestamp && (
                      <span className="text-[9px] text-gray-600">{change.timestamp}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-200 leading-relaxed mb-1">
                    {change.change}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">{change.reason}</span>
                    <span className={`text-[10px] font-medium ${change.impact === "high" ? "text-blue-400" : "text-gray-500"}`}>
                      ↑ {t(`impact${change.impact === "high" ? "High" : "Medium"}`)}
                    </span>
                  </div>
                </div>
                {videoId && change.timestamp && (
                  <SpriteFrame
                    videoId={videoId}
                    timestamp={change.timestamp}
                    className="hidden md:block"
                  />
                )}
                {clickable && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isAI && (
        <p className="text-[10px] text-gray-600 mt-3 text-center">
          {t("fallbackNote")}
        </p>
      )}
    </div>
  );
}
