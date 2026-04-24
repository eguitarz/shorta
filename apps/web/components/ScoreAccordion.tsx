"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { trackEvent } from "@/lib/posthog";
import { GradeEvidence } from "@/components/analyzer/GradeEvidence";
import type { ScoreBreakdown } from "@/lib/scoring/types";

interface ScoreAccordionProps {
  category: "hook" | "structure" | "clarity" | "delivery";
  score: number;
  analysis: string;
  signals?: Record<string, any>;
  fallbackMetrics?: Record<string, any>;
  hookCategory?: string;
  hookPattern?: string;
  shouldBlur?: boolean;
  onUpgradeClick?: (feature: string) => void;
  defaultExpanded?: boolean;
  renderAnalysis: (text: string) => React.ReactNode;
  /** When true, render the GradeEvidence narration above the signals list. */
  evidenceMode?: boolean;
  /** Score breakdown per signal; required to render evidence narration. */
  breakdown?: ScoreBreakdown[keyof ScoreBreakdown];
  /** Video duration in seconds. Used to pick short-form vs long-form flip thresholds. */
  videoDuration?: number;
}

const ICONS: Record<string, string> = {
  hook: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  structure: "M4 6h16M4 10h16M4 14h16M4 18h16",
  clarity: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  delivery: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
};

function getLetterGradeStatic(score: number) {
  if (score >= 100) return { label: "S", color: "purple" };
  if (score >= 80) return { label: "A", color: "green" };
  if (score >= 70) return { label: "B", color: "blue" };
  if (score >= 60) return { label: "C", color: "yellow" };
  if (score >= 50) return { label: "D", color: "orange" };
  return { label: "F", color: "red" };
}

function getMetricLabelStatic(score: number, t: any) {
  if (score >= 80) return { label: t("metrics.labels.excellent"), color: "green" };
  if (score >= 60) return { label: t("metrics.labels.good"), color: "blue" };
  if (score >= 40) return { label: t("metrics.labels.fair"), color: "yellow" };
  if (score >= 20) return { label: t("metrics.labels.weak"), color: "orange" };
  return { label: t("metrics.labels.poor"), color: "red" };
}

function MetricRow({ label, tooltip, value, color }: { label: string; tooltip: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 cursor-help group relative">
        {label}
        <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
          {tooltip}
        </span>
      </span>
      <span className={`font-semibold text-${color}-400`}>{value}</span>
    </div>
  );
}

function HookSignalsMetrics({ signals, t, tCommon }: { signals: any; t: any; tCommon: any }) {
  return (
    <>
      <MetricRow
        label={t("metrics.hook.timeToClaim")}
        tooltip={t("metrics.hook.tooltips.timeToClaim")}
        value={`${signals.TTClaim}s`}
        color={signals.TTClaim <= 1.5 ? "green" : signals.TTClaim <= 3 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.hook.patternBreak")}
        tooltip={t("metrics.hook.tooltips.patternBreak")}
        value={`${signals.PB}/5`}
        color={signals.PB >= 4 ? "green" : signals.PB >= 3 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.hook.specifics")}
        tooltip={t("metrics.hook.tooltips.specifics")}
        value={t("found", { count: signals.Spec })}
        color={signals.Spec >= 2 ? "green" : signals.Spec >= 1 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.hook.hookQuestion")}
        tooltip={t("metrics.hook.tooltips.hookQuestion")}
        value={signals.QC > 0 ? tCommon("yes") : tCommon("no")}
        color={signals.QC > 0 ? "green" : "gray"}
      />
    </>
  );
}

function StructureSignalsMetrics({ signals, t, tCommon }: { signals: any; t: any; tCommon: any }) {
  return (
    <>
      <MetricRow
        label={t("metrics.structure.beatCount")}
        tooltip={t("metrics.structure.tooltips.beatCount")}
        value={t("metrics.structure.beats", { count: signals.BC })}
        color={signals.BC >= 3 && signals.BC <= 6 ? "green" : "yellow"}
      />
      <MetricRow
        label={t("metrics.structure.progressMarkers")}
        tooltip={t("metrics.structure.tooltips.progressMarkers")}
        value={t("found", { count: signals.PM })}
        color={signals.PM >= 2 ? "green" : signals.PM >= 1 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.structure.payoffPresence")}
        tooltip={t("metrics.structure.tooltips.payoffPresence")}
        value={signals.PP ? tCommon("yes") : tCommon("no")}
        color={signals.PP ? "green" : "red"}
      />
      <MetricRow
        label={t("metrics.structure.loopCue")}
        tooltip={t("metrics.structure.tooltips.loopCue")}
        value={signals.LC ? tCommon("yes") : tCommon("no")}
        color={signals.LC ? "green" : "gray"}
      />
    </>
  );
}

function ClaritySignalsMetrics({ signals, t, tCommon }: { signals: any; t: any; tCommon: any }) {
  const wps = signals.duration > 0 ? (signals.wordCount / signals.duration).toFixed(1) : "0";
  return (
    <>
      <MetricRow
        label={t("metrics.clarity.wordsPerSecond")}
        tooltip={t("metrics.clarity.tooltips.wordsPerSecond")}
        value={`${wps} WPS`}
        color={parseFloat(wps) >= 3 && parseFloat(wps) <= 4 ? "green" : parseFloat(wps) >= 2.5 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.clarity.sentenceComplexity")}
        tooltip={t("metrics.clarity.tooltips.sentenceComplexity")}
        value={`${signals.SC}/5`}
        color={signals.SC <= 2 ? "green" : signals.SC <= 3 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.clarity.topicJumps")}
        tooltip={t("metrics.clarity.tooltips.topicJumps")}
        value={String(signals.TJ)}
        color={signals.TJ <= 1 ? "green" : signals.TJ <= 2 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.clarity.redundancy")}
        tooltip={t("metrics.clarity.tooltips.redundancy")}
        value={`${signals.RD}/5`}
        color={signals.RD <= 1 ? "green" : signals.RD <= 2 ? "yellow" : "red"}
      />
    </>
  );
}

function DeliverySignalsMetrics({ signals, t, tCommon }: { signals: any; t: any; tCommon: any }) {
  return (
    <>
      <MetricRow
        label={t("metrics.delivery.loudnessStability")}
        tooltip={t("metrics.delivery.tooltips.loudnessStability")}
        value={`${signals.LS}/5`}
        color={signals.LS >= 4 ? "green" : signals.LS >= 3 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.delivery.audioQuality")}
        tooltip={t("metrics.delivery.tooltips.audioQuality")}
        value={`${signals.NS}/5`}
        color={signals.NS >= 4 ? "green" : signals.NS >= 3 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.delivery.pauses")}
        tooltip={t("metrics.delivery.tooltips.pauses")}
        value={String(signals.pauseCount)}
        color={signals.pauseCount >= 2 ? "green" : signals.pauseCount >= 1 ? "yellow" : "red"}
      />
      <MetricRow
        label={t("metrics.delivery.energyCurve")}
        tooltip={t("metrics.delivery.tooltips.energyCurve")}
        value={signals.EC ? tCommon("yes") : tCommon("no")}
        color={signals.EC ? "green" : "gray"}
      />
    </>
  );
}

function FallbackMetrics({ category, metrics, t }: { category: string; metrics: any; t: any }) {
  if (!metrics) return null;

  if (category === "hook") {
    return (
      <>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.hook.duration")}</span><span className="text-white font-semibold">{metrics.duration}s</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.hook.viralPattern")}</span><span className={`text-${getMetricLabelStatic(metrics.viralPattern, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.viralPattern, t).label}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.hook.loopStrength")}</span><span className={`text-${getMetricLabelStatic(metrics.loopStrength, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.loopStrength, t).label}</span></div>
      </>
    );
  }
  if (category === "structure") {
    return (
      <>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.structure.videoLength")}</span><span className="text-white font-semibold">{metrics.videoLength}s</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.structure.pacingConsistency")}</span><span className={`text-${getMetricLabelStatic(metrics.pacingConsistency, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.pacingConsistency, t).label}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.structure.payoffTiming")}</span><span className={`text-${getMetricLabelStatic(metrics.payoffTiming, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.payoffTiming, t).label}</span></div>
      </>
    );
  }
  if (category === "clarity") {
    return (
      <>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.clarity.contentType")}</span><span className="text-white font-semibold">{metrics.contentType}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.clarity.valueClarity")}</span><span className={`text-${getMetricLabelStatic(metrics.valueClarity, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.valueClarity, t).label}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t("metrics.clarity.uniqueness")}</span><span className={`text-${getMetricLabelStatic(metrics.uniqueness, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.uniqueness, t).label}</span></div>
      </>
    );
  }
  // delivery
  return (
    <>
      <div className="flex justify-between"><span className="text-gray-500">{t("metrics.delivery.energyLevel")}</span><span className={`text-${getMetricLabelStatic(metrics.energyLevel, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.energyLevel, t).label}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">{t("metrics.delivery.vocalClarity")}</span><span className={`text-${getMetricLabelStatic(metrics.vocalClarity, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.vocalClarity, t).label}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">{t("metrics.delivery.presence")}</span><span className={`text-${getMetricLabelStatic(metrics.presence, t).color}-400 font-semibold`}>{getMetricLabelStatic(metrics.presence, t).label}</span></div>
    </>
  );
}

export function ScoreAccordion({
  category,
  score,
  analysis,
  signals,
  fallbackMetrics,
  hookCategory,
  hookPattern,
  shouldBlur = false,
  onUpgradeClick,
  defaultExpanded = false,
  renderAnalysis: renderAnalysisFn,
  evidenceMode = false,
  breakdown,
  videoDuration,
}: ScoreAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const t = useTranslations("analyzer");
  const tCommon = useTranslations("common");

  const clampedScore = Math.min(Math.round(score), 100);
  const grade = getLetterGradeStatic(clampedScore);

  const blurProps = shouldBlur
    ? {
        className: `space-y-2 text-xs mb-3 max-w-sm blur-sm cursor-pointer select-none`,
        onClick: () => onUpgradeClick?.("performance-cards"),
        style: { pointerEvents: "auto" as const, userSelect: "none" as const },
      }
    : { className: "space-y-2 text-xs mb-3 max-w-sm" };

  const SignalsComponent =
    category === "hook" ? HookSignalsMetrics :
    category === "structure" ? StructureSignalsMetrics :
    category === "clarity" ? ClaritySignalsMetrics :
    DeliverySignalsMetrics;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden transition-all duration-200" id={`score-${category}`}>
      <button
        className="w-full flex items-center gap-2 p-3 hover:bg-gray-800/30 transition-colors"
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          if (next) {
            trackEvent('score_accordion_expanded', { category });
          }
        }}
        aria-expanded={expanded}
        aria-controls={`score-${category}-content`}
      >
        <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS[category]} />
        </svg>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          {t(`metrics.${category}.title`)}
        </span>
        <span className={`text-lg font-bold text-${grade.color}-500`}>{grade.label}</span>
        <span className="text-[10px] text-gray-600">{clampedScore}/100</span>
        <div className="flex-1" />
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3" id={`score-${category}-content`}>
          {evidenceMode && !shouldBlur && (
            <GradeEvidence
              category={category}
              signals={signals as any}
              breakdown={breakdown as any}
              videoDuration={videoDuration}
            />
          )}
          <div {...blurProps}>
            {signals ? (
              <SignalsComponent signals={signals} t={t} tCommon={tCommon} />
            ) : (
              <FallbackMetrics category={category} metrics={fallbackMetrics} t={t} />
            )}
          </div>

          {category === "hook" && hookCategory && (
            <div className="space-y-1.5 mb-3">
              <span className="inline-block px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-[10px] font-semibold uppercase tracking-wide">
                {(() => { try { return t(`hooks.types.${hookCategory}.label`); } catch { return hookCategory; } })()}
              </span>
              {hookPattern && <p className="text-[10px] text-gray-500">{hookPattern}</p>}
            </div>
          )}

          <div
            className={`pt-3 border-t border-gray-800 ${shouldBlur ? "blur-sm cursor-pointer select-none" : ""}`}
            onClick={shouldBlur ? () => onUpgradeClick?.("performance-cards") : undefined}
            style={shouldBlur ? { pointerEvents: "auto", userSelect: "none" } : {}}
          >
            {renderAnalysisFn(analysis)}
          </div>
        </div>
      )}
    </div>
  );
}
