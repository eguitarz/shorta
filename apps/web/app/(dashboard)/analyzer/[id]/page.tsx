"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, Film } from "lucide-react";

interface Beat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
  title: string;
  transcript: string;
  visual: string;
  audio: string;
  retention: {
    level: string;
    analysis: string;
    issues: Array<{
      severity: string;
      message: string;
      suggestion: string;
    }>;
  };
}

interface AnalysisData {
  url: string;
  classification: {
    format: string;
    confidence: number;
    evidence: string[];
  };
  lintSummary: {
    totalRules: number;
    score: number;
    passed: number;
    warnings: number;
    errors: number;
  };
  storyboard: {
    overview: {
      title: string;
      length: number;
      hookPattern: string;
      contentType: string;
      targetAudience: string;
    };
    beats: Beat[];
    performance: {
      score: number;
      hookStrength: number;
      structurePacing: number;
      deliveryPerformance: number;
      retentionDrivers: string[];
      pacingStrategy: string;
      visualEngagementTactics: string;
    };
    replicationBlueprint: {
      elementsToKeep: string[];
      elementsToAdapt: string[];
      mistakesToAvoid: string[];
      patternVariations: string[];
    };
  };
  analyzedAt: string;
}

export default function AnalyzerResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    const data = sessionStorage.getItem(`analysis_${id}`);

    if (!data) {
      // Redirect to create page if no data found
      router.push("/analyzer/create");
      return;
    }

    try {
      const parsed = JSON.parse(data);
      setAnalysisData(parsed);
    } catch (error) {
      console.error("Failed to parse analysis data:", error);
      router.push("/analyzer/create");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  const totalIssues = analysisData.storyboard.beats.reduce(
    (acc, beat) => acc + beat.retention.issues.length,
    0
  );

  const getBeatTypeIcon = (type: string) => {
    return "⚡"; // Default icon, can expand later
  };

  const getRetentionColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "minimal_drop":
        return "text-green-500";
      case "moderate_drop":
        return "text-yellow-500";
      case "high_drop":
        return "text-orange-500";
      case "critical_drop":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/analyzer/create")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← New Analysis
          </button>
          <div className="text-sm text-gray-400">
            {analysisData.storyboard.overview.title || "Analysis"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-black">
        <div className="max-w-6xl mx-auto p-8">
          {/* Beat-by-Beat Breakdown Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold">Beat-by-Beat Breakdown</h1>
            </div>
            <div className="text-sm text-gray-400">
              {analysisData.storyboard.beats.length} beats •{" "}
              {totalIssues} {totalIssues === 1 ? "issue" : "issues"} found
            </div>
          </div>

          {/* Beats */}
          <div className="space-y-6">
            {analysisData.storyboard.beats.map((beat) => (
              <div
                key={beat.beatNumber}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6"
              >
                {/* Beat Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm">
                      Beat {beat.beatNumber}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-400">
                      {formatTime(beat.startTime)} - {formatTime(beat.endTime)}s
                    </span>
                    <span className="text-xs px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded font-semibold uppercase">
                      {getBeatTypeIcon(beat.type)} {beat.type}
                    </span>
                  </div>
                </div>

                {/* Beat Title */}
                <h2 className="text-2xl font-bold mb-6">{beat.title}</h2>

                {/* Transcript */}
                <div className="mb-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Transcript
                  </div>
                  <p className="text-gray-300 italic">"{beat.transcript}"</p>
                </div>

                {/* Visual */}
                <div className="mb-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Visual
                  </div>
                  <p className="text-gray-300">{beat.visual}</p>
                </div>

                {/* Audio */}
                <div className="mb-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Audio
                  </div>
                  <p className="text-gray-300">{beat.audio}</p>
                </div>

                {/* Retention */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Retention
                  </div>
                  <div
                    className={`font-semibold mb-2 ${getRetentionColor(
                      beat.retention.level
                    )}`}
                  >
                    {beat.retention.level.replace("_", " ")}
                  </div>

                  {/* Issues */}
                  {beat.retention.issues.length > 0 && (
                    <div className="space-y-2">
                      {beat.retention.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          {issue.severity === "error" ? (
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : issue.severity === "warning" ? (
                            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-gray-300">{issue.message}</p>
                            {issue.suggestion && (
                              <button className="text-xs text-gray-500 hover:text-gray-400 mt-1">
                                Approve suggestion
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {beat.retention.issues.length === 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p className="text-gray-300">{beat.retention.analysis}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Performance Summary */}
          <div className="mt-8 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Overall Score</div>
                <div className="text-4xl font-bold text-orange-500">
                  {analysisData.storyboard.performance.score.toFixed(1)}/10
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Hook Strength</span>
                  <span className="text-white">
                    {analysisData.storyboard.performance.hookStrength.toFixed(1)}/4
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Structure & Pacing</span>
                  <span className="text-white">
                    {analysisData.storyboard.performance.structurePacing.toFixed(1)}/3
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delivery & Performance</span>
                  <span className="text-white">
                    {analysisData.storyboard.performance.deliveryPerformance.toFixed(1)}/3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
