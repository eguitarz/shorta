"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, Trophy, BarChart2, Target } from "lucide-react";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTranslations } from "next-intl";

interface TrendPoint {
  id: string;
  date: string;
  score: number;
  title: string;
}

interface InsightsData {
  trend: TrendPoint[];
  thisMonthAvg: number | null;
  lastMonthAvg: number | null;
  totalCompleted: number;
  bestScore: number | null;
  allTimeAvg: number | null;
}

function getLetterGrade(score: number): string {
  if (score >= 100) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getGradeColor(score: number): string {
  if (score >= 100) return "text-purple-400";
  if (score >= 80) return "text-green-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: TrendPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const score = payload[0].value;
  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg max-w-[160px]">
      <p className="font-semibold text-white mb-0.5 truncate">{point.title}</p>
      <p className={`font-bold text-sm ${getGradeColor(score)}`}>
        {score} <span className="text-gray-400 font-normal">({getLetterGrade(score)})</span>
      </p>
      <p className="text-gray-500 mt-0.5">
        {new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </p>
    </div>
  );
}

export function ScoreInsights() {
  const router = useRouter();
  const t = useTranslations("dashboard.insights");
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("/api/analyses/insights");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // ignore - component just won't render
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  // Don't render if no data or no analyses yet
  if (loading || !data || data.totalCompleted < 2) return null;

  const { trend, thisMonthAvg, lastMonthAvg, totalCompleted, bestScore, allTimeAvg } = data;

  // Calculate trend direction
  let trendDelta: number | null = null;
  let TrendIcon = Minus;
  let trendColor = "text-gray-400";
  let trendBg = "bg-gray-500/10";

  if (thisMonthAvg !== null && lastMonthAvg !== null) {
    trendDelta = thisMonthAvg - lastMonthAvg;
    if (trendDelta > 2) {
      TrendIcon = TrendingUp;
      trendColor = "text-green-400";
      trendBg = "bg-green-500/10";
    } else if (trendDelta < -2) {
      TrendIcon = TrendingDown;
      trendColor = "text-red-400";
      trendBg = "bg-red-500/10";
    }
  } else if (trend.length >= 3) {
    // Use last 3 vs previous 3 if no month comparison
    const recent3 = trend.slice(-3).map((p) => p.score);
    const prev3 = trend.slice(-6, -3).map((p) => p.score);
    if (prev3.length > 0) {
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
      const prevAvg = prev3.reduce((a, b) => a + b, 0) / prev3.length;
      trendDelta = Math.round(recentAvg - prevAvg);
      if (trendDelta > 2) {
        TrendIcon = TrendingUp;
        trendColor = "text-green-400";
        trendBg = "bg-green-500/10";
      } else if (trendDelta < -2) {
        TrendIcon = TrendingDown;
        trendColor = "text-red-400";
        trendBg = "bg-red-500/10";
      }
    }
  }

  // Chart Y-axis domain with some padding
  const chartScores = trend.map((p) => p.score);
  const minScore = Math.max(0, Math.min(...chartScores) - 10);
  const maxScore = Math.min(120, Math.max(...chartScores) + 10);

  const displayAvg = thisMonthAvg ?? allTimeAvg;

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-1">
            <BarChart2 className="w-4 h-4" />
            <span>{t("label")}</span>
          </div>
          <h2 className="text-xl font-semibold">{t("title")}</h2>
        </div>
        <button
          onClick={() => router.push("/library")}
          className="text-sm text-orange-500 hover:text-orange-400 font-medium"
        >
          {t("viewHistory")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats column */}
        <div className="space-y-3">
          {/* Trend stat */}
          {trendDelta !== null && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${trendBg} border border-gray-800`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trendBg}`}>
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("trend")}</p>
                <p className={`text-lg font-bold ${trendColor}`}>
                  {trendDelta > 0 ? "+" : ""}{trendDelta} {t("points")}
                </p>
              </div>
            </div>
          )}

          {/* Avg score */}
          {displayAvg !== null && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  {thisMonthAvg !== null ? t("avgThisMonth") : t("avgScore")}
                </p>
                <p className={`text-lg font-bold ${getGradeColor(displayAvg)}`}>
                  {displayAvg}{" "}
                  <span className="text-sm font-normal text-gray-400">
                    ({getLetterGrade(displayAvg)})
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Best score */}
          {bestScore !== null && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/5 border border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("bestScore")}</p>
                <p className={`text-lg font-bold ${getGradeColor(bestScore)}`}>
                  {bestScore}{" "}
                  <span className="text-sm font-normal text-gray-400">
                    ({getLetterGrade(bestScore)})
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Total analyses */}
          <p className="text-xs text-gray-600 pl-1">
            {t("basedOn", { count: totalCompleted })}
          </p>
        </div>

        {/* Chart column */}
        {trend.length >= 3 && (
          <div className="lg:col-span-2">
            <p className="text-xs text-gray-500 mb-3">{t("chartLabel")}</p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                  {/* Average reference line */}
                  {allTimeAvg !== null && (
                    <ReferenceLine
                      y={allTimeAvg}
                      stroke="#4b5563"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const color =
                        payload.score >= 80
                          ? "#4ade80"
                          : payload.score >= 60
                          ? "#facc15"
                          : "#f87171";
                      return (
                        <circle
                          key={`dot-${payload.id}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={color}
                          stroke="#141414"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                    activeDot={{ r: 6, fill: "#f97316", stroke: "#141414", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Min / Max labels */}
            <div className="flex justify-between text-[10px] text-gray-600 mt-1 px-1">
              <span>{new Date(trend[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              <span>{new Date(trend[trend.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
