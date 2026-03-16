'use client';

import { useState } from 'react';
import { Loader2, ImageIcon, TrendingUp, Eye, Zap, MousePointerClick, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ThumbnailScore {
  overall: number;
  visualClarity: number;
  textImpact: number;
  emotionalHook: number;
  ctrPotential: number;
}

interface ThumbnailImprovement {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

interface ThumbnailAnalysisResult {
  scores: ThumbnailScore;
  strengths: string[];
  improvements: ThumbnailImprovement[];
  overallFeedback: string;
}

interface ThumbnailAnalysisProps {
  videoId: string;
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#f97316' :
    '#ef4444';

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1f2937" strokeWidth={4} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color =
    score >= 80 ? 'bg-green-500' :
    score >= 60 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="w-5 text-gray-500 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-xs font-semibold text-white">{score}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${color}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export function ThumbnailAnalysis({ videoId }: ThumbnailAnalysisProps) {
  const t = useTranslations('analyzer.thumbnail');
  const [analysis, setAnalysis] = useState<ThumbnailAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          throw new Error(data.message || 'Insufficient credits for thumbnail analysis');
        }
        throw new Error(data.error || 'Analysis failed');
      }
      setAnalysis(data);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze thumbnail');
    } finally {
      setLoading(false);
    }
  };

  const overallScore = analysis?.scores.overall ?? null;
  const scoreColor =
    overallScore === null ? 'text-gray-400' :
    overallScore >= 80 ? 'text-green-400' :
    overallScore >= 60 ? 'text-orange-400' :
    'text-red-400';

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
      {/* Header — always visible, clickable to expand */}
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-gray-800/30 transition-colors"
        onClick={() => {
          if (!analysis && !loading) {
            handleAnalyze();
          } else {
            setExpanded((e) => !e);
          }
        }}
        disabled={loading}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pink-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">{t('title')}</p>
              {overallScore !== null && (
                <span className={`text-sm font-bold ${scoreColor}`}>{overallScore}/100</span>
              )}
            </div>
            <p className="text-xs text-gray-500">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          {!analysis && !loading && (
            <span className="text-xs text-pink-400 font-medium px-3 py-1.5 bg-pink-500/10 rounded-lg border border-pink-500/20 hover:bg-pink-500/20 transition-colors">
              {t('analyze')}
            </span>
          )}
          {analysis && (
            expanded
              ? <ChevronUp className="w-4 h-4 text-gray-500" />
              : <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Error */}
      {error && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Expanded results */}
      {analysis && expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-800/50">
          {/* Thumbnail + overall score */}
          <div className="flex items-start gap-4 pt-5">
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-32 rounded-lg object-cover border border-gray-700"
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Overall score ring */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <ScoreRing score={analysis.scores.overall} size={56} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-bold ${scoreColor}`}>{analysis.scores.overall}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t('overallScore')}</p>
                  <p className="text-xs text-gray-500">{t('ctrScore')}</p>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="space-y-2">
                <ScoreBar
                  label={t('scores.visualClarity')}
                  score={analysis.scores.visualClarity}
                  icon={<Eye className="w-3.5 h-3.5" />}
                />
                <ScoreBar
                  label={t('scores.textImpact')}
                  score={analysis.scores.textImpact}
                  icon={<Zap className="w-3.5 h-3.5" />}
                />
                <ScoreBar
                  label={t('scores.emotionalHook')}
                  score={analysis.scores.emotionalHook}
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                />
                <ScoreBar
                  label={t('scores.ctrPotential')}
                  score={analysis.scores.ctrPotential}
                  icon={<MousePointerClick className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          </div>

          {/* Overall feedback */}
          <div className="flex items-start gap-2.5 p-3 bg-gray-900/60 rounded-lg">
            <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 leading-relaxed">{analysis.overallFeedback}</p>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('strengths')}</p>
              <div className="space-y-1.5">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {analysis.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('improvements')}</p>
              <div className="space-y-2.5">
                {analysis.improvements.map((item, i) => (
                  <div key={i} className="p-3 bg-gray-900/60 rounded-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                      <PriorityBadge priority={item.priority} />
                      <span className="text-sm font-medium text-white">{item.title}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
