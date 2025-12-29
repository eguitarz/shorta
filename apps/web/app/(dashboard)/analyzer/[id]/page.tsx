"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

// YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Play,
  Zap,
  ChevronDown,
  ChevronUp,
  XCircle,
  AlertTriangle,
  Info as InfoIcon,
  Clock,
  Lightbulb
} from "lucide-react";

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
      timestamp?: string; // Timestamp like "0:03" or "0:00-0:04" where the issue occurs
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
    moderate: number;
    critical: number;
  };
  storyboard: {
    overview: {
      title: string;
      length: number;
      hookCategory: string;
      hookPattern: string;
      nicheCategory: string;
      nicheDescription: string;
      contentType: string;
      targetAudience: string;
    };
    beats: Beat[];
    performance: {
      score: number;
      hookStrength: number;
      structurePacing: number;
      deliveryPerformance: number;
      directorAssessment: string;
      retentionDrivers: string[];
      pacingStrategy: string;
      visualEngagementTactics: string;
      hook: {
        duration: number;
        viralPattern: number;
        loopStrength: number;
        analysis: string;
      };
      structure: {
        videoLength: number;
        pacingConsistency: number;
        payoffTiming: number;
        analysis: string;
      };
      content: {
        contentType: string;
        valueClarity: number;
        uniqueness: number;
        analysis: string;
      };
      delivery: {
        energyLevel: number;
        vocalClarity: number;
        presence: number;
        analysis: string;
      };
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

// Extract YouTube video ID from URL
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export default function AnalyzerResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>("Initializing...");
  const [hookExpanded, setHookExpanded] = useState(false);
  const [structureExpanded, setStructureExpanded] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const toggleIssue = (beatNumber: number, issueIndex: number) => {
    const key = `${beatNumber}-${issueIndex}`;
    setExpandedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isIssueExpanded = (beatNumber: number, issueIndex: number) => {
    return expandedIssues.has(`${beatNumber}-${issueIndex}`);
  };

  useEffect(() => {
    const analyzeVideo = async () => {
      const id = params.id as string;
      const stored = sessionStorage.getItem(`analysis_${id}`);

      if (!stored) {
        router.push("/analyzer/create");
        return;
      }

      try {
        const parsed = JSON.parse(stored);

        // If analysis is already complete, just display it
        if (parsed.status === "complete" && parsed.storyboard) {
          setAnalysisData(parsed);
          setLoading(false);
          return;
        }

        // Otherwise, we need to analyze
        const url = parsed.url;
        if (!url) {
          router.push("/analyzer/create");
          return;
        }

        // Start analysis
        setLoadingStage("Classifying video format...");

        const response = await fetch("/api/analyze-storyboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to analyze storyboard");
        }

        setLoadingStage("Analyzing storyboard...");

        // Store complete analysis data
        const completeData = {
          url: data.url,
          classification: data.classification,
          lintSummary: data.lintSummary,
          storyboard: data.storyboard,
          analyzedAt: new Date().toISOString(),
          status: "complete",
        };

        sessionStorage.setItem(`analysis_${id}`, JSON.stringify(completeData));
        setAnalysisData(completeData);
        setLoading(false);
      } catch (err) {
        console.error("Analysis error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    analyzeVideo();
  }, [params.id, router]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!analysisData) return;

    const videoId = extractYouTubeId(analysisData.url);
    if (!videoId) return;

    // Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initPlayer = () => {
      if (playerContainerRef.current && !playerRef.current) {
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId: videoId,
          playerVars: {
            modestbranding: 1,
            rel: 0,
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [analysisData]);

  // Function to seek video to specific timestamp
  const seekToTimestamp = (seconds: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo();

      // Scroll to video player
      if (playerContainerRef.current) {
        playerContainerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  if (loading) {
    return (
      <>
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Projects
            </button>
            <button className="text-sm text-white font-medium border-b-2 border-orange-500 pb-[22px] -mb-[17px]">
              Analyzing...
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-lg">
            <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
            <span className="text-sm text-orange-500 font-medium">Analyzing</span>
          </div>
        </header>

        {/* Loading Content */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Analyzing Your Short</h2>
            <p className="text-gray-400 mb-4">{loadingStage}</p>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Classifying video format</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Running retention analysis</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                <span>Generating storyboard breakdown</span>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/analyzer/create")}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Analysis Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push("/analyzer/create")}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!analysisData) {
    return null;
  }

  const videoId = extractYouTubeId(analysisData.url);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Parse timestamp string like "0:03" or "0:00-0:04" to seconds
  const parseTimestamp = (timestamp: string): number => {
    // If it's a range, take the start time
    const timeStr = timestamp.includes('-') ? timestamp.split('-')[0] : timestamp;
    const [mins, secs] = timeStr.split(':').map(Number);
    return mins * 60 + secs;
  };

  // Calculate issue counts by severity
  const allIssues = analysisData.storyboard.beats.flatMap(beat =>
    beat.retention.issues.map(issue => ({
      ...issue,
      beatNumber: beat.beatNumber,
      beatTitle: beat.title,
      timestamp: `${formatTime(beat.startTime)}-${formatTime(beat.endTime)}`
    }))
  );
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const moderateCount = allIssues.filter(i => i.severity === 'moderate').length;
  const minorCount = allIssues.filter(i => i.severity === 'minor').length;

  const getSeverityIcon = (severity: string, className: string = "w-4 h-4") => {
    switch (severity) {
      case 'critical':
        return <XCircle className={`${className} text-red-500`} />;
      case 'moderate':
        return <AlertTriangle className={`${className} text-orange-500`} />;
      case 'minor':
        return <InfoIcon className={`${className} text-blue-500`} />;
      default:
        return <CheckCircle2 className={`${className} text-green-500`} />;
    }
  };

  // Badge helpers for dynamic labels based on scores
  const getHookBadge = (score: number) => {
    if (score <= 25) return { label: 'Weak', color: 'red' };
    if (score <= 50) return { label: 'Moderate', color: 'yellow' };
    if (score <= 75) return { label: 'Good', color: 'orange' };
    return { label: 'Strong', color: 'green' };
  };

  const getStructureBadge = (score: number) => {
    if (score <= 25) return { label: 'Choppy', color: 'red' };
    if (score <= 50) return { label: 'Uneven', color: 'yellow' };
    if (score <= 75) return { label: 'Well-Paced', color: 'blue' };
    return { label: 'Excellent', color: 'green' };
  };

  const getContentBadge = (score: number) => {
    if (score <= 25) return { label: 'Low Value', color: 'red' };
    if (score <= 50) return { label: 'Some Value', color: 'yellow' };
    if (score <= 75) return { label: 'High Value', color: 'green' };
    return { label: 'Exceptional', color: 'emerald' };
  };

  const getDeliveryBadge = (score: number) => {
    if (score <= 25) return { label: 'Flat', color: 'red' };
    if (score <= 50) return { label: 'Adequate', color: 'yellow' };
    if (score <= 75) return { label: 'Engaging', color: 'purple' };
    return { label: 'Captivating', color: 'pink' };
  };

  // Render analysis text with bullet points and AI-emphasized text
  const renderAnalysis = (text: string) => {
    // Split by bullet points or newlines
    const lines = text.split(/\n|•/).filter(line => line.trim());

    return (
      <ul className="space-y-1.5 text-xs text-gray-400">
        {lines.map((line, idx) => {
          // Parse line into segments, looking for **text** markers from AI
          const segments: Array<{ text: string; bold: boolean }> = [];
          const trimmedLine = line.trim();

          // Match **text** patterns for emphasis
          const emphasisPattern = /\*\*([^*]+)\*\*/g;
          let lastIndex = 0;
          let match;

          while ((match = emphasisPattern.exec(trimmedLine)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
              segments.push({ text: trimmedLine.substring(lastIndex, match.index), bold: false });
            }
            // Add emphasized text (without the ** markers)
            segments.push({ text: match[1], bold: true });
            lastIndex = match.index + match[0].length;
          }

          // Add remaining text
          if (lastIndex < trimmedLine.length) {
            segments.push({ text: trimmedLine.substring(lastIndex), bold: false });
          }

          // If no segments were found (no ** markers), just add the whole line
          if (segments.length === 0) {
            segments.push({ text: trimmedLine, bold: false });
          }

          return (
            <li key={idx} className="flex gap-2">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>
                {segments.map((seg, segIdx) =>
                  seg.bold ? (
                    <strong key={segIdx} className="text-gray-200 font-medium">{seg.text}</strong>
                  ) : (
                    <span key={segIdx}>{seg.text}</span>
                  )
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
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
            Projects
          </button>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            {analysisData.storyboard.overview.title || "My New Short"}
          </button>
          <button className="text-sm text-white font-medium border-b-2 border-orange-500 pb-[22px] -mb-[17px]">
            Analysis
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-500 font-medium">Analysis Complete</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[1fr_380px] h-full">
          {/* Left Column - Analysis */}
          <div className="p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">Video Analysis</h1>
              </div>
              <p className="text-sm text-gray-400">
                Based on retention data from similar viral shorts.
              </p>
            </div>

            {/* Video and Cards Grid */}
            <div className="grid grid-cols-[240px_1fr] gap-6 mb-8">
              {/* Video Container */}
              <div className="relative rounded-2xl aspect-[9/16] overflow-hidden bg-black">
                {videoId ? (
                  <div
                    ref={playerContainerRef}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <p className="text-sm">Video unavailable</p>
                  </div>
                )}
              </div>

              {/* Right Side */}
              <div className="flex flex-col gap-4">
                {/* Overall Score */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overall Score</div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold">{Math.round(analysisData.lintSummary.score)}</span>
                    <span className="text-lg text-gray-500">/100</span>
                  </div>
                  <div className="pt-3 border-t border-gray-800">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Director's Take</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      {(() => {
                        // Parse director assessment for **emphasis**
                        const text = analysisData.storyboard.performance.directorAssessment;
                        const segments: Array<{ text: string; bold: boolean }> = [];
                        const emphasisPattern = /\*\*([^*]+)\*\*/g;
                        let lastIndex = 0;
                        let match;

                        while ((match = emphasisPattern.exec(text)) !== null) {
                          if (match.index > lastIndex) {
                            segments.push({ text: text.substring(lastIndex, match.index), bold: false });
                          }
                          segments.push({ text: match[1], bold: true });
                          lastIndex = match.index + match[0].length;
                        }

                        if (lastIndex < text.length) {
                          segments.push({ text: text.substring(lastIndex), bold: false });
                        }

                        if (segments.length === 0) {
                          segments.push({ text, bold: false });
                        }

                        return (
                          <>
                            {segments.map((seg, idx) =>
                              seg.bold ? (
                                <strong key={idx} className="text-gray-200 font-medium">{seg.text}</strong>
                              ) : (
                                <span key={idx}>{seg.text}</span>
                              )
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Niche Category */}
                  {analysisData.storyboard.overview.nicheCategory && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Niche</div>
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-semibold uppercase tracking-wide w-fit">
                          {analysisData.storyboard.overview.nicheCategory}
                        </span>
                        {analysisData.storyboard.overview.nicheDescription && (
                          <p className="text-xs text-gray-400">
                            {analysisData.storyboard.overview.nicheDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Analysis Cards Grid */}
                <div className="grid grid-cols-4 gap-3 items-start">
                  {/* Hook Card */}
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Hook</span>
                      <button
                        onClick={() => setHookExpanded(!hookExpanded)}
                        className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                      >
                        {hookExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                      </button>
                    </div>
                    {(() => {
                      const hookScore = Math.round(analysisData.storyboard.performance.hookStrength * 25);
                      const badge = getHookBadge(hookScore);
                      return (
                        <>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold">{hookScore}</span>
                            <span className="text-sm text-gray-500">/100</span>
                            <span className={`ml-auto px-1.5 py-0.5 bg-${badge.color}-500/10 text-${badge.color}-500 rounded text-[9px] font-semibold uppercase`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${hookScore}%` }}></div>
                          </div>

                          {/* Always show metrics */}
                          <div className="space-y-2 text-xs mb-3">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Hook Duration</span>
                              <span className="text-white font-semibold">{analysisData.storyboard.performance.hook.duration}s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Viral Pattern</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.hook.viralPattern}/100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Loop Strength</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.hook.loopStrength}/100</span>
                            </div>
                          </div>

                          {/* Hook Category Badge + Pattern */}
                          {analysisData.storyboard.overview.hookCategory && (
                            <div className="space-y-1.5 mb-3">
                              <span className="inline-block px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-[10px] font-semibold uppercase tracking-wide">
                                {analysisData.storyboard.overview.hookCategory}
                              </span>
                              {analysisData.storyboard.overview.hookPattern && (
                                <p className="text-[10px] text-gray-500">
                                  {analysisData.storyboard.overview.hookPattern}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Only analysis is collapsible */}
                          {hookExpanded && (
                            <div className="pt-3 border-t border-gray-800">
                              {renderAnalysis(analysisData.storyboard.performance.hook.analysis)}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Structure Card */}
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Structure</span>
                      <button
                        onClick={() => setStructureExpanded(!structureExpanded)}
                        className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                      >
                        {structureExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                      </button>
                    </div>
                    {(() => {
                      const structureScore = Math.round(analysisData.storyboard.performance.structurePacing * 33.33);
                      const badge = getStructureBadge(structureScore);
                      return (
                        <>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold">{structureScore}</span>
                            <span className="text-sm text-gray-500">/100</span>
                            <span className={`ml-auto px-1.5 py-0.5 bg-${badge.color}-500/10 text-${badge.color}-500 rounded text-[9px] font-semibold uppercase`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${structureScore}%` }}></div>
                          </div>

                          {/* Always show metrics */}
                          <div className="space-y-2 text-xs mb-3">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Video Length</span>
                              <span className="text-white font-semibold">{analysisData.storyboard.performance.structure.videoLength}s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Pacing Consistency</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.structure.pacingConsistency}/100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Payoff Timing</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.structure.payoffTiming}/100</span>
                            </div>
                          </div>

                          {/* Only analysis is collapsible */}
                          {structureExpanded && (
                            <div className="pt-3 border-t border-gray-800">
                              {renderAnalysis(analysisData.storyboard.performance.structure.analysis)}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Content Card */}
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Content</span>
                      <button
                        onClick={() => setContentExpanded(!contentExpanded)}
                        className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                      >
                        {contentExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                      </button>
                    </div>
                    {(() => {
                      // Calculate content score from average of valueClarity and uniqueness
                      const contentScore = Math.round((analysisData.storyboard.performance.content.valueClarity + analysisData.storyboard.performance.content.uniqueness) / 2);
                      const badge = getContentBadge(contentScore);
                      return (
                        <>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold">{contentScore}</span>
                            <span className="text-sm text-gray-500">/100</span>
                            <span className={`ml-auto px-1.5 py-0.5 bg-${badge.color}-500/10 text-${badge.color}-500 rounded text-[9px] font-semibold uppercase`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${contentScore}%` }}></div>
                          </div>

                          {/* Always show metrics */}
                          <div className="space-y-2 text-xs mb-3">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Content Type</span>
                              <span className="text-white font-semibold">{analysisData.storyboard.performance.content.contentType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Value Clarity</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.content.valueClarity}/100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Uniqueness</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.content.uniqueness}/100</span>
                            </div>
                          </div>

                          {/* Only analysis is collapsible */}
                          {contentExpanded && (
                            <div className="pt-3 border-t border-gray-800">
                              {renderAnalysis(analysisData.storyboard.performance.content.analysis)}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Delivery Card */}
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Delivery</span>
                      <button
                        onClick={() => setDeliveryExpanded(!deliveryExpanded)}
                        className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                      >
                        {deliveryExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                      </button>
                    </div>
                    {(() => {
                      const deliveryScore = Math.round(analysisData.storyboard.performance.deliveryPerformance * 33.33);
                      const badge = getDeliveryBadge(deliveryScore);
                      return (
                        <>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold">{deliveryScore}</span>
                            <span className="text-sm text-gray-500">/100</span>
                            <span className={`ml-auto px-1.5 py-0.5 bg-${badge.color}-500/10 text-${badge.color}-500 rounded text-[9px] font-semibold uppercase`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${deliveryScore}%` }}></div>
                          </div>

                          {/* Always show metrics */}
                          <div className="space-y-2 text-xs mb-3">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Energy Level</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.delivery.energyLevel}/100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Vocal Clarity</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.delivery.vocalClarity}/100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Presence</span>
                              <span className="text-gray-300 font-semibold">{analysisData.storyboard.performance.delivery.presence}/100</span>
                            </div>
                          </div>

                          {/* Only analysis is collapsible */}
                          {deliveryExpanded && (
                            <div className="pt-3 border-t border-gray-800">
                              {renderAnalysis(analysisData.storyboard.performance.delivery.analysis)}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Beat-by-Beat Breakdown */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">🎬 Beat-by-Beat Breakdown</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{analysisData.storyboard.beats.length} beats</span>
                  {criticalCount > 0 && (
                    <div className="group relative">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 rounded-lg cursor-help">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-sm font-semibold text-red-500">{criticalCount}</span>
                      </div>
                      <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-800 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                        <div className="text-xs font-semibold text-red-500 mb-2">CRITICAL ({criticalCount})</div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {allIssues.filter(i => i.severity === 'critical').map((issue, idx) => (
                            <div key={idx} className="text-xs text-gray-400">
                              <span className="text-gray-500">Beat {issue.beatNumber}:</span> {issue.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {moderateCount > 0 && (
                    <div className="group relative">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 rounded-lg cursor-help">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-500">{moderateCount}</span>
                      </div>
                      <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-800 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                        <div className="text-xs font-semibold text-orange-500 mb-2">MODERATE ({moderateCount})</div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {allIssues.filter(i => i.severity === 'moderate').map((issue, idx) => (
                            <div key={idx} className="text-xs text-gray-400">
                              <span className="text-gray-500">Beat {issue.beatNumber}:</span> {issue.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {minorCount > 0 && (
                    <div className="group relative">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-lg cursor-help">
                        <InfoIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-500">{minorCount}</span>
                      </div>
                      <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-800 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                        <div className="text-xs font-semibold text-blue-500 mb-2">MINOR ({minorCount})</div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {allIssues.filter(i => i.severity === 'minor').map((issue, idx) => (
                            <div key={idx} className="text-xs text-gray-400">
                              <span className="text-gray-500">Beat {issue.beatNumber}:</span> {issue.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {criticalCount === 0 && moderateCount === 0 && minorCount === 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-sm font-semibold text-green-500">No issues</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {analysisData.storyboard.beats.map((beat) => (
                  <div key={beat.beatNumber} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-semibold">Beat {beat.beatNumber}</span>
                          <button
                            onClick={() => seekToTimestamp(beat.startTime)}
                            className="text-xs font-mono text-gray-500 hover:text-orange-500 transition-colors hover:underline cursor-pointer"
                            title="Click to jump to this beat"
                          >
                            {formatTime(beat.startTime)} - {formatTime(beat.endTime)}
                          </button>
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs font-semibold">
                            {beat.type}
                          </span>
                          {beat.retention.issues.some(i => i.severity === 'critical') && (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs font-semibold">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-white mb-3">{beat.title}</h4>

                        <div className="space-y-2 mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Transcript</div>
                            <p className="text-sm text-gray-300">"{beat.transcript}"</p>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Visual</div>
                            <p className="text-sm text-gray-300">{beat.visual}</p>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Audio</div>
                            <p className="text-sm text-gray-300">{beat.audio}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Retention</div>
                      <div className="text-sm font-semibold text-white">
                        {beat.retention.level.replace('_', ' ')}
                      </div>
                    </div>
                    {beat.retention.issues.length > 0 ? (
                      <div className="space-y-2">
                        {beat.retention.issues.map((issue, idx) => {
                          const isExpanded = isIssueExpanded(beat.beatNumber, idx);
                          return (
                            <div
                              key={idx}
                              className={`border border-gray-800 rounded-lg overflow-hidden transition-all ${
                                isExpanded ? 'bg-[#0d0d0d]' : 'bg-[#1a1a1a] hover:bg-[#1e1e1e]'
                              }`}
                            >
                              {/* Collapsed View */}
                              <button
                                onClick={() => toggleIssue(beat.beatNumber, idx)}
                                className="w-full px-3 py-2.5 flex items-center gap-3 text-left"
                              >
                                <div className="flex-shrink-0">
                                  {getSeverityIcon(issue.severity, "w-4 h-4")}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[10px] font-bold uppercase ${
                                      issue.severity === 'critical' ? 'text-red-500' :
                                      issue.severity === 'moderate' ? 'text-orange-500' :
                                      'text-blue-500'
                                    }`}>
                                      {issue.severity}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        seekToTimestamp(issue.timestamp ? parseTimestamp(issue.timestamp) : beat.startTime);
                                      }}
                                      className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-orange-500 transition-colors group"
                                      title="Click to jump to this moment in the video"
                                    >
                                      <Clock className="w-2.5 h-2.5 group-hover:text-orange-500" />
                                      <span className="group-hover:underline font-mono">
                                        {issue.timestamp || `${formatTime(beat.startTime)}-${formatTime(beat.endTime)}`}
                                      </span>
                                    </button>
                                  </div>
                                  <p className={`text-xs text-gray-400 ${!isExpanded && 'truncate'}`}>
                                    {issue.message}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  )}
                                </div>
                              </button>

                              {/* Expanded View */}
                              {isExpanded && (
                                <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-800">
                                  {/* Full Message */}
                                  <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Issue</div>
                                    <p className="text-sm text-gray-300 leading-relaxed">{issue.message}</p>
                                  </div>

                                  {/* Solution */}
                                  {issue.suggestion && (
                                    <div className="border-l-2 border-green-500/30 bg-green-500/5 rounded-r-lg pl-3 pr-2 py-2">
                                      <div className="flex items-start gap-2">
                                        <Lightbulb className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="text-[10px] font-semibold text-green-500 uppercase mb-1">Solution</div>
                                          <p className="text-xs text-gray-300 leading-relaxed mb-2">{issue.suggestion}</p>
                                          <button className="px-2.5 py-1 text-[10px] font-medium text-green-500 hover:text-white bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500 rounded transition-colors">
                                            Apply Fix
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-green-500 uppercase mb-1">No Issues</div>
                          <p className="text-sm text-gray-400 leading-relaxed">{beat.retention.analysis}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Re-hook Variants */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl font-semibold">Re-hook Variants</h3>
                <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded text-xs font-semibold uppercase">
                  AI Suggested
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {analysisData.storyboard.replicationBlueprint.patternVariations.slice(0, 2).map((variant, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Variant {String.fromCharCode(65 + idx)}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{variant}</p>
                    <button className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Variant {String.fromCharCode(65 + idx)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Approved Changes */}
          <div className="border-l border-gray-800 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Approved Changes</h3>
              <span className="w-7 h-7 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                0
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 mb-2">No changes approved yet</p>
              <p className="text-xs text-gray-600 max-w-[240px]">
                Review suggestions in the Analysis panel and approve actions to add them here.
              </p>
            </div>

            {/* Generate Button */}
            <div className="mt-auto">
              <div className="mb-3 text-xs text-gray-500 text-center">
                Est. Processing Time: <span className="text-white">~45s</span>
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                <Zap className="w-4 h-4" fill="currentColor" />
                Generate using approved changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
