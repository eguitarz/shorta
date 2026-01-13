'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info as InfoIcon,
  Clock,
  Lightbulb,
  Heart,
  Upload,
} from 'lucide-react';

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
      timestamp?: string;
      ruleId?: string;
      ruleName?: string;
    }>;
  };
}

interface AnalysisData {
  url: string;
  isUploadedFile?: boolean;
  classification: {
    format: string;
    confidence: number;
    evidence: string[];
  };
  lintSummary: {
    totalRules: number;
    score: number;
    baseScore?: number;
    bonusPoints?: number;
    bonusDetails?: string[];
    passed: number;
    moderate: number;
    critical: number;
    minor?: number;
    totalIssues?: number;
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
      videoStats?: {
        views: number;
        likes: number;
        publishedAt: string;
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

export default function SharedAnalysisPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        console.log('[SharedPage] Fetching analysis for job:', params.job_id);
        const response = await fetch(`/api/share/${params.job_id}`);
        const data = await response.json();
        console.log('[SharedPage] API response:', { status: response.status, data });

        if (!response.ok) {
          const errorMsg = data.error || 'Failed to load analysis';
          console.error('[SharedPage] Error:', errorMsg, data);
          throw new Error(errorMsg);
        }

        console.log('[SharedPage] Analysis loaded successfully');
        setAnalysis(data.analysis);
      } catch (err) {
        console.error('[SharedPage] Failed to load:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [params.job_id]);

  // YouTube player initialization
  useEffect(() => {
    if (!analysis?.url || playerRef.current) return;

    // Skip YouTube player for uploaded files (they use Gemini file URIs)
    if (analysis.isUploadedFile) return;

    // Extract video ID from YouTube URL (including Shorts)
    const getYouTubeVideoId = (url: string) => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/, // YouTube Shorts support
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
      return null;
    };

    const videoId = getYouTubeVideoId(analysis.url);
    if (!videoId) return;

    const initPlayer = () => {
      if (typeof window.YT === 'undefined' || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      if (playerContainerRef.current && !playerRef.current) {
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
          },
        });
      }
    };

    // Load YouTube API
    if (!document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, [analysis?.url]);

  // Helper to format bullet points with **emphasis**
  const formatBulletPoints = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => l.replace(/^[-•]\s*/, ''));

    return (
      <ul className="space-y-1.5 text-xs text-gray-400">
        {lines.map((line, idx) => {
          const segments: Array<{ text: string; bold: boolean }> = [];
          const emphasisPattern = /\*\*([^*]+)\*\*/g;
          let lastIndex = 0;
          let match;

          while ((match = emphasisPattern.exec(line)) !== null) {
            if (match.index > lastIndex) {
              segments.push({ text: line.substring(lastIndex, match.index), bold: false });
            }
            segments.push({ text: match[1], bold: true });
            lastIndex = match.index + match[0].length;
          }

          if (lastIndex < line.length) {
            segments.push({ text: line.substring(lastIndex), bold: false });
          }

          if (segments.length === 0) {
            segments.push({ text: line, bold: false });
          }

          return (
            <li key={idx} className="flex gap-2">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>
                {segments.map((seg, segIdx) =>
                  seg.bold ? (
                    <strong key={segIdx} className="text-gray-200 font-medium">
                      {seg.text}
                    </strong>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-lg">Loading analysis...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
          <p className="text-gray-400 mb-4">{error || 'This shared link is not available'}</p>
          <div className="text-xs text-gray-600 bg-gray-900 p-4 rounded-lg text-left">
            <p className="font-medium text-gray-500 mb-2">Possible reasons:</p>
            <ul className="space-y-1">
              <li>• The analysis has not been shared yet</li>
              <li>• The link is incorrect or expired</li>
              <li>• Database migrations need to be applied</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'moderate':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'minor':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Read-Only Banner */}
      <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400">
            This is a shared analysis - Read-only view
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {analysis.isUploadedFile
              ? 'Analysis: Uploaded video'
              : `Analysis: ${analysis.storyboard.overview.title}`
            }
          </h1>
          <p className="text-sm text-gray-400">
            Insights are generated using patterns learned from high-retention Shorts in similar topic categories.
          </p>
        </div>

        {/* Video Player & Score Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Video Player */}
          <div className="bg-gray-900 rounded-xl overflow-hidden" style={{ height: '500px' }}>
            {analysis.isUploadedFile ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">Uploaded Video</p>
                <p className="text-xs text-gray-600">Preview not available for uploaded files</p>
              </div>
            ) : analysis.url ? (
              <div ref={playerContainerRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">Video</p>
                <p className="text-xs text-gray-600">Preview not available</p>
              </div>
            )}
          </div>

          {/* Overall Score */}
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Score</h3>
              <InfoIcon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-6xl font-bold text-orange-500 mb-2">
              {analysis.lintSummary.score}
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              {analysis.lintSummary.totalIssues || 0} issues found across{' '}
              {analysis.storyboard.beats.length} beats
            </p>

            {/* Issue Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Passed</span>
                <span className="text-sm text-green-500 font-medium">
                  {analysis.lintSummary.passed} rules
                </span>
              </div>
              {analysis.lintSummary.critical > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Critical</span>
                  <span className="text-sm text-red-500 font-medium">
                    {analysis.lintSummary.critical} issues (-10 pts each)
                  </span>
                </div>
              )}
              {analysis.lintSummary.moderate > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Moderate</span>
                  <span className="text-sm text-orange-500 font-medium">
                    {analysis.lintSummary.moderate} issues (-5 pts each)
                  </span>
                </div>
              )}
              {(analysis.lintSummary.minor || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Minor</span>
                  <span className="text-sm text-blue-500 font-medium">
                    {analysis.lintSummary.minor} issues (-2 pts each)
                  </span>
                </div>
              )}
            </div>

            {/* Bonus Points */}
            {analysis.lintSummary.bonusPoints && analysis.lintSummary.bonusPoints > 0 && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">
                    +{analysis.lintSummary.bonusPoints} Bonus Points
                  </span>
                </div>
                <ul className="space-y-1">
                  {analysis.lintSummary.bonusDetails?.map((detail, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex gap-2">
                      <span className="text-green-500">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Performance Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Hook',
              score: analysis.storyboard.performance.hookStrength,
              icon: Lightbulb,
            },
            {
              title: 'Structure',
              score: analysis.storyboard.performance.structurePacing,
              icon: Clock,
            },
            {
              title: 'Content',
              score: analysis.storyboard.performance.content.valueClarity,
              icon: CheckCircle2,
            },
            {
              title: 'Delivery',
              score: analysis.storyboard.performance.deliveryPerformance,
              icon: Heart,
            },
          ].map((card) => (
            <div key={card.title} className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{card.title}</span>
              </div>
              <div className="text-2xl font-bold">{card.score}%</div>
            </div>
          ))}
        </div>

        {/* Video Metadata */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Niche */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h4 className="text-sm text-gray-400 mb-2">Niche</h4>
            <p className="text-base font-semibold text-white mb-1">
              {analysis.storyboard.overview.nicheCategory}
            </p>
            <p className="text-xs text-gray-500">
              {analysis.storyboard.overview.nicheDescription}
            </p>
          </div>

          {/* Hook Type */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h4 className="text-sm text-gray-400 mb-2">Hook Type</h4>
            <p className="text-base font-semibold text-white mb-1">
              {analysis.storyboard.overview.hookCategory}
            </p>
            <p className="text-xs text-gray-500">
              {analysis.storyboard.overview.hookPattern}
            </p>
          </div>

          {/* Content Type */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h4 className="text-sm text-gray-400 mb-2">Content Type</h4>
            <p className="text-base font-semibold text-white">
              {analysis.storyboard.overview.contentType}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Target: {analysis.storyboard.overview.targetAudience}
            </p>
          </div>
        </div>

        {/* Director Assessment */}
        {analysis.storyboard.performance.directorAssessment && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Director Assessment</h3>
            {formatBulletPoints(analysis.storyboard.performance.directorAssessment)}
          </div>
        )}

        {/* Beat-by-Beat Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Beat-by-Beat Breakdown</h2>
          <div className="space-y-4">
            {analysis.storyboard.beats.map((beat) => (
              <div key={beat.beatNumber} className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Beat {beat.beatNumber}: {beat.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {beat.startTime}s - {beat.endTime}s ({beat.type})
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-sm ${
                      beat.retention.level === 'minimal_drop'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {beat.retention.level.replace('_', ' ')}
                  </div>
                </div>

                {/* Transcript */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Transcript</h4>
                  <p className="text-sm text-gray-300">{beat.transcript}</p>
                </div>

                {/* Issues */}
                {beat.retention.issues.length > 0 && (
                  <div className="space-y-2">
                    {beat.retention.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                      >
                        <div className="flex items-start gap-2">
                          {issue.severity === 'critical' ? (
                            <XCircle className="w-4 h-4 mt-0.5" />
                          ) : issue.severity === 'moderate' ? (
                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                          ) : (
                            <InfoIcon className="w-4 h-4 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">{issue.message}</p>
                            {issue.suggestion && (
                              <p className="text-xs opacity-80">{issue.suggestion}</p>
                            )}
                            {issue.ruleName && (
                              <div className="mt-2">
                                <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                                  {issue.ruleName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
