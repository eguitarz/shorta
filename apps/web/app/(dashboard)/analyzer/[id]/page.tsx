"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

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
  Lightbulb,
  Eye,
  Heart,
  X,
  Upload,
  Copy,
  Sparkles,
  GitCompare,
  ArrowRight,
  PanelRightOpen
} from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { ExportSubtitleButton } from "@/components/ExportSubtitleButton";
import { ExportStoryboardButton } from "@/components/ExportStoryboardButton";
import { UpgradeModal } from "@/components/UpgradeModal";
import { UsageLimitBanner } from "@/components/UsageLimitBanner";
import { SeverityVoteButtons } from "@/components/SeverityVoteButtons";
import { LearningIndicator } from "@/components/LearningIndicator";
import { useIssuePreferences } from "@/hooks/useIssuePreferences";
import { getSeverityColor } from "@/lib/preferences/issue-key";
import { VideoPickerModal, type UserVideo } from "@/components/VideoPickerModal";
import { CompareModal } from "@/components/CompareModal";
import { HOOK_TYPES, HOOK_TYPE_DESCRIPTIONS, type HookCategory } from "@/lib/scoring/hook-types";
import { NICHE_WEIGHTS } from "@/lib/scoring/constants";
import { REHOOK_PRESETS, type RehookPreset } from "@/lib/rehook";
import type { VideoFormat } from "@/lib/linter/types";
import { RetentionCurveChart } from "@/components/RetentionCurveChart";
import type { VideoRetentionCurve } from "@/lib/youtube/types";

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

interface ApprovedChange {
  id: string;
  type: 'fix' | 'variant' | 'rehook';
  beatNumber?: number;
  beatTitle?: string;
  issue?: {
    severity: string;
    message: string;
    suggestion: string;
  };
  variant?: {
    index: number;
    label: string;
    text: string;
  };
  rehook?: {
    preset?: RehookPreset;
    hookType?: HookCategory;
    label: string;
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
    // Deterministic scoring signals
    _format?: 'talking_head' | 'gameplay' | 'demo' | 'other';
    _signals?: {
      hook: {
        TTClaim: number;
        PB: number;
        Spec: number;
        QC: number;
      };
      structure: {
        BC: number;
        PM: number;
        PP: boolean;
        LC: boolean;
      };
      clarity: {
        wordCount: number;
        duration: number;
        SC: number;
        TJ: number;
        RD: number;
      };
      delivery: {
        LS: number;
        NS: number;
        pauseCount: number;
        fillerCount: number;
        EC: boolean;
      };
    };
    _scoreBreakdown?: {
      hook: { TTClaim: number; PB: number; Spec: number; QC: number };
      structure: { BC: number; PM: number; PP: number; LC: number };
      clarity: { WPS: number; SC: number; TJ: number; RD: number };
      delivery: { LS: number; NS: number; PQ: number; EC: number };
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

// Format relative time (e.g., "30 days ago")
const formatRelativeTime = (dateString: string, t: any): string => {
  const now = new Date();
  const published = new Date(dateString);
  const diffMs = now.getTime() - published.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffHours / (24 * 30));
  const diffYears = Math.floor(diffHours / (24 * 365));

  if (diffYears > 0) {
    return t(diffYears === 1 ? 'year' : 'years', { count: diffYears });
  } else if (diffMonths > 0) {
    return t(diffMonths === 1 ? 'month' : 'months', { count: diffMonths });
  } else if (diffDays > 0) {
    return t(diffDays === 1 ? 'day' : 'days', { count: diffDays });
  } else if (diffHours > 0) {
    return t(diffHours === 1 ? 'hour' : 'hours', { count: diffHours });
  } else if (diffMinutes > 0) {
    return t(diffMinutes === 1 ? 'minute' : 'minutes', { count: diffMinutes });
  } else {
    return t('justNow');
  }
};

export default function AnalyzerResultsPage() {
  const t = useTranslations('analyzer');
  const tShared = useTranslations('sharedAnalysis');
  const tCommon = useTranslations('common');
  const tTime = useTranslations('time');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTrialMode = searchParams.get('trial') === 'true';

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hookExpanded, setHookExpanded] = useState(false);
  const [structureExpanded, setStructureExpanded] = useState(false);
  const [clarityExpanded, setClarityExpanded] = useState(false);
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);

  // Async job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'pending' | 'classifying' | 'linting' | 'storyboarding' | 'completed' | 'failed'>('pending');
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [approvedChangesCollapsed, setApprovedChangesCollapsed] = useState(true);
  const [approvedChanges, setApprovedChanges] = useState<ApprovedChange[]>([]);
  const [videoStats, setVideoStats] = useState<{ views: number; likes: number; comments: number; publishedAt: string; duration: number | null } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [beatBreakdownCollapsed, setBeatBreakdownCollapsed] = useState(true);
  const beatRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Metadata suggestions state
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    titles: string[];
    description: string;
  } | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Tier and upgrade state
  // If trial mode, force anonymous tier
  const [userTier, setUserTier] = useState<'anonymous' | 'free' | 'founder' | 'lifetime'>(
    isTrialMode ? 'anonymous' : 'free'
  );
  const [analysesRemaining, setAnalysesRemaining] = useState<number>(3);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string>('');

  // Comparison modal state
  const [showVideoPickerModal, setShowVideoPickerModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareBaseVideo, setCompareBaseVideo] = useState<UserVideo | null>(null);

  // Retention curve state
  const [retentionCurve, setRetentionCurve] = useState<VideoRetentionCurve | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionRefreshing, setRetentionRefreshing] = useState(false);

  // Re-hook generation state
  const [selectedPreset, setSelectedPreset] = useState<RehookPreset | null>(null);
  const [selectedHookType, setSelectedHookType] = useState<HookCategory | null>(null);
  const [hookTypePickerOpen, setHookTypePickerOpen] = useState(false);

  const approvedChangesCount = approvedChanges.length;

  // Blur and disable buttons only for anonymous trial users (not logged-in users)
  const shouldBlur = userTier === 'anonymous';
  const shouldDisableButtons = userTier === 'anonymous';

  // Issue severity preferences (for logged-in users)
  const isLoggedIn = userTier !== 'anonymous';
  const {
    isLearning,
    getEffectiveSeverity,
    voteUp,
    voteDown,
    resetPreference,
    hasPreference,
  } = useIssuePreferences(isLoggedIn);

  const handleRetentionRefresh = async () => {
    if (!videoUrl) return;
    const ytId = extractYouTubeId(videoUrl);
    if (!ytId) return;
    setRetentionRefreshing(true);
    try {
      const response = await fetch(`/api/youtube/retention-curve?videoId=${encodeURIComponent(ytId)}&refresh=true`);
      if (response.ok) {
        const result = await response.json();
        setRetentionCurve(result.data || null);
      }
    } catch {
      // Graceful degradation
    } finally {
      setRetentionRefreshing(false);
    }
  };

  const scrollToBeat = (beatNumber: number) => {
    // Expand beat breakdown if collapsed and targeting beat > 1
    const needsExpand = beatBreakdownCollapsed && beatNumber > 1;
    if (needsExpand) {
      setBeatBreakdownCollapsed(false);
    }

    // Scroll to beat after a brief delay to allow expansion animation
    setTimeout(() => {
      const beatElement = beatRefs.current[beatNumber];
      if (beatElement) {
        beatElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash highlight effect
        beatElement.style.backgroundColor = 'rgba(251, 146, 60, 0.1)';
        setTimeout(() => {
          beatElement.style.backgroundColor = '';
        }, 1000);
      }
    }, needsExpand ? 300 : 0);
  };

  const approveFix = (beatNumber: number, beatTitle: string, issue: any) => {
    const id = `fix-${beatNumber}-${Date.now()}`;
    const newChange: ApprovedChange = {
      id,
      type: 'fix',
      beatNumber,
      beatTitle,
      issue: {
        severity: issue.severity,
        message: issue.message,
        suggestion: issue.suggestion,
      },
    };
    setApprovedChanges(prev => [...prev, newChange]);
  };

  const approveVariant = (index: number, variantText: string) => {
    // Remove any existing variant (only one variant allowed at a time)
    const withoutVariants = approvedChanges.filter(change => change.type !== 'variant');

    const id = `variant-${index}-${Date.now()}`;
    // Use "Custom" for generated variants (index 99), otherwise A, B, C...
    const label = index === 99 ? 'Custom' : String.fromCharCode(65 + index);
    const newChange: ApprovedChange = {
      id,
      type: 'variant',
      variant: {
        index,
        label,
        text: variantText,
      },
    };
    setApprovedChanges([...withoutVariants, newChange]);
  };

  const addRehookRequest = () => {
    if (!selectedPreset && !selectedHookType) return;

    // Remove any existing rehook request or variant (only one allowed at a time)
    const withoutRehooks = approvedChanges.filter(
      change => change.type !== 'rehook' && change.type !== 'variant'
    );

    const label = selectedHookType
      ? selectedHookType
      : REHOOK_PRESETS.find(p => p.id === selectedPreset)?.label || selectedPreset || '';

    const id = `rehook-${Date.now()}`;
    const newChange: ApprovedChange = {
      id,
      type: 'rehook',
      rehook: {
        preset: selectedPreset || undefined,
        hookType: selectedHookType || undefined,
        label,
      },
    };

    setApprovedChanges([...withoutRehooks, newChange]);

    // Reset selection after adding
    setSelectedPreset(null);
    setSelectedHookType(null);
    setHookTypePickerOpen(false);
  };

  const handlePresetSelect = (preset: RehookPreset) => {
    if (selectedPreset === preset) {
      setSelectedPreset(null);
    } else {
      setSelectedPreset(preset);
      setSelectedHookType(null); // Clear hook type when preset is selected
    }
  };

  const handleHookTypeSelect = (hookType: HookCategory) => {
    if (selectedHookType === hookType) {
      setSelectedHookType(null);
    } else {
      setSelectedHookType(hookType);
      setSelectedPreset(null); // Clear preset when hook type is selected
    }
  };

  const removeApprovedChange = (id: string) => {
    setApprovedChanges(prev => prev.filter(change => change.id !== id));
  };

  const handleGenerate = async () => {
    if (!analysisData || approvedChanges.length === 0) return;

    try {
      setGenerating(true);

      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyboard: analysisData.storyboard,
          approvedChanges,
          url: videoUrl,
          analysisJobId: jobId, // Pass job ID for database link
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        throw new Error(errorMsg || 'Failed to generate storyboard');
      }

      // Navigate using the database storyboard ID if available
      // Fall back to sessionStorage for backward compatibility
      if (data.storyboard_id) {
        router.push(`/analyzer/generate/${data.storyboard_id}`);
      } else {
        // Fallback: Store in sessionStorage (if DB save failed)
        const generatedId = `gen_${Date.now()}`;
        sessionStorage.setItem(`generated_${generatedId}`, JSON.stringify(data));
        router.push(`/analyzer/generate/${generatedId}`);
      }
    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate storyboard';
      alert(`Generation failed: ${errorMessage}\n\nCheck browser console for details.`);
      setError(errorMessage);
      setGenerating(false);
    }
  };

  const handleSuggestMetadata = async () => {
    if (!jobId || suggestionsLoading) return;

    try {
      setSuggestionsLoading(true);
      setSuggestions(null);

      const response = await fetch('/api/suggest-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate suggestions');
      }

      setSuggestions(data);
    } catch (err) {
      console.error('Suggestions error:', err);
      alert(`Failed to generate suggestions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Load URL or fileUri immediately and show video player
  useEffect(() => {
    const id = params.id as string;
    const stored = sessionStorage.getItem(`analysis_${id}`);

    // If trial mode, skip sessionStorage check - we'll fetch from API
    if (isTrialMode) {
      console.log('[Trial Mode] Skipping sessionStorage, will poll job API');
      // The job polling effect will handle fetching the video URL
      return;
    }

    // If sessionStorage exists, use it (old flow)
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Extract URL or fileUri - either one is valid
        const url = parsed.url;
        const storedFileUri = parsed.fileUri;
        const storedFileName = parsed.fileName;

        if (!url && !storedFileUri) {
          router.push("/analyzer/create");
          return;
        }

        if (url) {
          setVideoUrl(url);
        }
        if (storedFileUri) {
          setFileUri(storedFileUri);
          setFileName(storedFileName || 'Uploaded video');
        }

        // If analysis is already complete, just display it
        if (parsed.status === "complete" && parsed.storyboard) {
          setAnalysisData(parsed);
          setLoading(false);
        }

        // If job_id is stored, use it
        if (parsed.job_id) {
          setJobId(parsed.job_id);
        }
      } catch (err) {
        console.error("Error loading from sessionStorage:", err);
        router.push("/analyzer/create");
      }
      return;
    }

    // No sessionStorage - check if ID is a job ID from database
    // UUID format: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      console.log('[Analyzer] ID looks like a job ID, fetching from API:', id);
      // Set jobId - the polling effect will handle fetching the job
      setJobId(id);

      // Try to fetch job immediately to get video URL
      const fetchJob = async () => {
        try {
          const response = await fetch(`/api/jobs/analysis/${id}?locale=${locale}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch job');
          }

          // Set job status and video URL
          setJobStatus(data.status);
          setCurrentStep(data.current_step);
          setProgressPercent(data.progress_percent);

          if (data.video_url) {
            setVideoUrl(data.video_url);
          }

          // Handle uploaded videos with file_uri
          if (data.file_uri) {
            setFileUri(data.file_uri);
          }

          // If job is completed, load the analysis data
          if (data.status === 'completed' && data.storyboard) {
            const completeData = {
              url: data.url,
              classification: data.classification,
              lintSummary: data.lintSummary,
              storyboard: data.storyboard,
              analyzedAt: data.completed_at,
              status: 'complete',
            };
            setAnalysisData(completeData);
            setLoading(false);
          } else {
            // Job is still in progress, polling will handle updates
            setLoading(false);
          }
        } catch (err) {
          console.error('Failed to fetch job:', err);
          setError(err instanceof Error ? err.message : 'Failed to load analysis');
          setLoading(false);
        }
      };

      fetchJob();
      return;
    }

    // Not a UUID and no sessionStorage - redirect to create
    router.push("/analyzer/create");
  }, [params.id, router, isTrialMode]);

  // For trial mode, set job_id from URL params immediately
  useEffect(() => {
    if (isTrialMode && !jobId) {
      const id = params.id as string;
      console.log('[Trial Mode] Using job_id from URL:', id);
      setJobId(id);
    }
  }, [isTrialMode, jobId, params.id]);

  // Create analysis job if not already complete
  useEffect(() => {
    // Skip if trial mode (job already created by API)
    if (isTrialMode) return;

    // Need either videoUrl or fileUri, but not if already have job or analysis
    if ((!videoUrl && !fileUri) || analysisData || jobId) return;

    const createJob = async () => {
      try {
        const response = await fetch('/api/jobs/analysis/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fileUri ? { fileUri } : { url: videoUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create analysis job');
        }

        setJobId(data.job_id);
        setJobStatus(data.status);
        window.dispatchEvent(new Event('credits-changed'));

        // Store job info for persistence if user navigates away
        const id = params.id as string;
        sessionStorage.setItem(`analysis_${id}`, JSON.stringify({
          job_id: data.job_id,
          ...(videoUrl ? { url: videoUrl } : { fileUri, fileName }),
          status: 'pending',
        }));

        console.log('[Frontend] Job created:', data.job_id, fileUri ? '(uploaded file)' : '(YouTube URL)');
      } catch (err) {
        console.error('Job creation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to create job');
        setLoading(false);
      }
    };

    createJob();
  }, [videoUrl, fileUri, fileName, analysisData, jobId, params.id, isTrialMode]);

  // Poll job status every 3 seconds
  useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/analysis/${jobId}?locale=${locale}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch job status');
        }

        setJobStatus(data.status);
        setCurrentStep(data.current_step);
        setProgressPercent(data.progress_percent);

        // Extract tier info from response
        if (data.tier) {
          setUserTier(data.tier);
        }
        if (data.analyses_remaining !== undefined) {
          setAnalysesRemaining(data.analyses_remaining);
        }

        // Extract video URL or file_uri from job response for trial mode
        if (isTrialMode && data.video_url && !videoUrl) {
          console.log('[Trial Mode] Setting video URL from job:', data.video_url);
          setVideoUrl(data.video_url);
        }
        if (isTrialMode && data.file_uri && !fileUri) {
          console.log('[Trial Mode] Setting file URI from job:', data.file_uri);
          setFileUri(data.file_uri);
        }

        console.log('[Frontend] Poll:', data.status, `step ${data.current_step}/${data.total_steps}`);

        if (data.status === 'completed') {
          // Store complete results
          const completeData = {
            url: data.url,
            classification: data.classification,
            lintSummary: data.lintSummary,
            storyboard: data.storyboard,
            analyzedAt: data.completed_at,
            status: 'complete',
          };

          const id = params.id as string;
          sessionStorage.setItem(`analysis_${id}`, JSON.stringify(completeData));
          setAnalysisData(completeData);
          setLoading(false);

          clearInterval(interval);
          console.log('[Frontend] Analysis completed!');
        }

        if (data.status === 'failed') {
          setError(data.error_message || 'Analysis failed');
          setLoading(false);
          clearInterval(interval);
          console.error('[Frontend] Analysis failed:', data.error_message);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError(err instanceof Error ? err.message : 'Polling failed');
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [jobId, jobStatus, params.id]);

  // Fetch fresh YouTube stats on every render
  useEffect(() => {
    if (!videoUrl) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const response = await fetch(`/api/youtube-stats?url=${encodeURIComponent(videoUrl)}`);
        if (response.ok) {
          const stats = await response.json();
          setVideoStats(stats);
        } else {
          console.error('Failed to fetch YouTube stats');
          setVideoStats(null);
        }
      } catch (error) {
        console.error('Error fetching YouTube stats:', error);
        setVideoStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [videoUrl]);

  // Fetch retention curve once analysis is loaded and videoUrl is available.
  // Single retry after 2s if first attempt returns null (auth may not be ready on hard refresh).
  useEffect(() => {
    if (!videoUrl || !analysisData) return;
    const ytId = extractYouTubeId(videoUrl);
    if (!ytId) return;

    let cancelled = false;
    setRetentionLoading(true);

    const fetchCurve = async (attempt: number) => {
      try {
        const response = await fetch(`/api/youtube/retention-curve?videoId=${encodeURIComponent(ytId)}`);
        if (!response.ok || cancelled) { setRetentionLoading(false); return; }
        const result = await response.json();
        if (cancelled) return;

        if (result.data) {
          setRetentionCurve(result.data);
          setRetentionLoading(false);
        } else if (attempt < 2) {
          setTimeout(() => { if (!cancelled) fetchCurve(attempt + 1); }, 2000);
        } else {
          setRetentionLoading(false);
        }
      } catch {
        if (!cancelled) setRetentionLoading(false);
      }
    };
    fetchCurve(1);

    return () => { cancelled = true; };
  }, [videoUrl, analysisData]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!videoUrl) return;

    const videoId = extractYouTubeId(videoUrl);
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
  }, [videoUrl]);

  // Auto-expand approved changes panel when there are approved changes
  useEffect(() => {
    if (approvedChangesCount > 0) {
      setApprovedChangesCollapsed(false);
    }
  }, [approvedChangesCount]);

  // Reset re-hook state when analysis changes
  useEffect(() => {
    setSelectedPreset(null);
    setSelectedHookType(null);
    setHookTypePickerOpen(false);
  }, [params.id]);

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

  // Need either a URL or a fileUri to continue
  // Show loading state while waiting for job API to return video URL
  if (!videoUrl && !fileUri) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          <p className="text-gray-400 animate-pulse">Loading video...</p>
        </div>
      </div>
    );
  }

  const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const isUploadedFile = !!fileUri;

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

  // Calculate issue counts by severity (only if analysis is complete)
  const allIssues = analysisData ? analysisData.storyboard.beats.flatMap(beat =>
    (beat.retention?.issues || []).map(issue => ({
      ...issue,
      beatNumber: beat.beatNumber,
      beatTitle: beat.title,
      timestamp: `${formatTime(beat.startTime)}-${formatTime(beat.endTime)}`
    }))
  ) : [];
  // Calculate effective severity counts (respecting user preferences)
  const getIssueEffectiveSeverity = (issue: any) => {
    return getEffectiveSeverity({
      ruleId: issue.ruleId,
      message: issue.message,
      severity: issue.severity,
    });
  };
  const criticalCount = allIssues.filter(i => getIssueEffectiveSeverity(i) === 'critical').length;
  const moderateCount = allIssues.filter(i => getIssueEffectiveSeverity(i) === 'moderate').length;
  const minorCount = allIssues.filter(i => getIssueEffectiveSeverity(i) === 'minor').length;
  const ignoredCount = allIssues.filter(i => getIssueEffectiveSeverity(i) === 'ignored').length;

  // Group issues by message to deduplicate same rules across beats
  const groupedIssues = allIssues.reduce((acc, issue) => {
    const key = issue.message?.toLowerCase().trim() || '';
    if (!acc[key]) {
      acc[key] = {
        ...issue,
        beatNumbers: [issue.beatNumber],
        firstBeatNumber: issue.beatNumber,
      };
    } else {
      acc[key].beatNumbers.push(issue.beatNumber);
    }
    return acc;
  }, {} as Record<string, any>);

  const groupedIssuesList = Object.values(groupedIssues);

  const getSeverityIcon = (severity: string, className: string = "w-4 h-4") => {
    switch (severity) {
      case 'critical':
        return <XCircle className={`${className} text-red-500`} />;
      case 'moderate':
        return <AlertTriangle className={`${className} text-orange-500`} />;
      case 'minor':
        return <InfoIcon className={`${className} text-blue-500`} />;
      case 'ignored':
        return <Eye className={`${className} text-gray-500`} />;
      default:
        return <CheckCircle2 className={`${className} text-green-500`} />;
    }
  };

  // Letter grade helpers for scores
  // S: 100+, A: 80-99, B: 70-79, C: 60-69, D: 50-59, F: <50
  const getLetterGrade = (score: number) => {
    if (score >= 100) return { label: 'S', color: 'purple', comment: t('scores.comments.S') };
    if (score >= 80) return { label: 'A', color: 'green', comment: t('scores.comments.A') };
    if (score >= 70) return { label: 'B', color: 'blue', comment: t('scores.comments.B') };
    if (score >= 60) return { label: 'C', color: 'yellow', comment: t('scores.comments.C') };
    if (score >= 50) return { label: 'D', color: 'orange', comment: t('scores.comments.D') };
    return { label: 'F', color: 'red', comment: t('scores.comments.F') };
  };

  // Special clarity grading: Clear (≥75), Somewhat (50-74), Unclear (<50)
  const getClarityGrade = (score: number) => {
    if (score >= 75) return { label: t('metrics.labels.clear'), color: 'green' };
    if (score >= 50) return { label: t('metrics.labels.somewhat'), color: 'yellow' };
    return { label: t('metrics.labels.unclear'), color: 'red' };
  };

  // Convert metric scores to descriptive words
  const getMetricLabel = (score: number) => {
    if (score >= 80) return { label: t('metrics.labels.excellent'), color: 'green' };
    if (score >= 60) return { label: t('metrics.labels.good'), color: 'blue' };
    if (score >= 40) return { label: t('metrics.labels.fair'), color: 'yellow' };
    if (score >= 20) return { label: t('metrics.labels.weak'), color: 'orange' };
    return { label: t('metrics.labels.poor'), color: 'red' };
  };

  // Render analysis text with bullet points (clean, no bold)
  // Also renders backticks as styled inline code
  const renderAnalysis = (text: string) => {
    // Helper to parse inline backticks into styled spans
    const parseInlineCode = (str: string) => {
      const parts = str.split(/(`[^`]+`)/g);
      return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          const code = part.slice(1, -1);
          return (
            <span key={i} className="px-1 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[11px] font-mono">
              {code}
            </span>
          );
        }
        return part;
      });
    };

    // First try splitting by newlines
    let lines = text.split('\n').filter(line => line.trim().length > 0);

    // If only one line (paragraph), split by sentences
    if (lines.length === 1) {
      // Split by period followed by space, keeping the period with each sentence
      lines = text.split(/(?<=\.)\s+/).filter(line => line.trim().length > 0);
    }

    return (
      <ul className="space-y-1.5 text-xs text-gray-400">
        {lines.map((line, idx) => {
          let trimmedLine = line.trim();
          // Remove bullet character or dash if present at start
          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
            trimmedLine = trimmedLine.substring(1).trim();
          }
          // Remove leading numbers like "1." or "1)"
          trimmedLine = trimmedLine.replace(/^\d+[.)]\s*/, '');

          return (
            <li key={idx} className="flex gap-2">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>{parseInlineCode(trimmedLine)}</span>
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
          <span className="text-sm text-white font-medium border-b-2 border-orange-500 pb-[22px] -mb-[17px]">
            {t('breadcrumb.analysis')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-lg">
              <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
              <span className="text-sm text-orange-500 font-medium">{t('status.analyzing')}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-500 font-medium">{t('status.complete')}</span>
              </div>
              {jobId && <ShareButton jobId={jobId} />}
              {analysisData && (
                <>
                  {/* Compare Button - Only for logged-in users */}
                  {isLoggedIn && (
                    <button
                      onClick={() => setShowVideoPickerModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                      title="Compare with another video"
                    >
                      <GitCompare className="w-4 h-4" />
                      <span>{t('compare')}</span>
                    </button>
                  )}
                  <ExportSubtitleButton
                    beats={analysisData.storyboard.beats}
                    videoTitle={analysisData.storyboard.overview.title}
                  />
                  <ExportStoryboardButton analysisData={analysisData} />
                </>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className={`grid h-full transition-all duration-100 ${approvedChangesCollapsed ? 'grid-cols-[1fr_48px]' : 'grid-cols-[1fr_380px]'}`}>
          {/* Left Column - Analysis */}
          <div className="p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">
                  {isUploadedFile
                    ? t('title', { title: t('uploadedVideo') })
                    : t('title', { title: analysisData?.storyboard?.overview?.title || 'Video' })
                  }
                </h1>
              </div>
              <p className="text-sm text-gray-400">
                {t('subtitle')}
              </p>
            </div>

            {/* Video and Cards Grid */}
            <div className="grid grid-cols-[240px_1fr] gap-6 mb-8">
              {/* Video Container with Stats - Only show for YouTube videos */}
              {!isUploadedFile ? (
                <div className="flex flex-col gap-3">
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

                  {/* Video Stats */}
                  <div className="flex flex-col gap-2 px-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400 font-medium">
                          {statsLoading ? (
                            <span className="inline-block w-12 h-4 bg-gray-800 rounded animate-pulse"></span>
                          ) : videoStats?.views ? (
                            new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(videoStats.views)
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400 font-medium">
                          {statsLoading ? (
                            <span className="inline-block w-12 h-4 bg-gray-800 rounded animate-pulse"></span>
                          ) : videoStats?.likes ? (
                            new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(videoStats.likes)
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400 font-medium">
                        {statsLoading ? (
                          <span className="inline-block w-20 h-4 bg-gray-800 rounded animate-pulse"></span>
                        ) : videoStats?.publishedAt ? (
                          formatRelativeTime(videoStats.publishedAt, tTime)
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Placeholder for uploaded files */
                <div className="flex flex-col gap-3">
                  <div className="relative rounded-2xl aspect-[9/16] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Upload className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs text-center px-4">
                        {fileName || 'Uploaded Video'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Side */}
              <div className="flex flex-col gap-4">
                {loading || !analysisData ? (
                  <>
                    {/* Loading State with Progress */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        <div className="text-xs text-orange-500 font-medium">
                          {jobStatus === 'classifying' && t('status.classifying')}
                          {jobStatus === 'linting' && t('status.linting')}
                          {jobStatus === 'storyboarding' && t('status.storyboarding')}
                          {(jobStatus === 'pending' || !jobStatus) && currentStep === 0 && t('status.starting')}
                          {(jobStatus === 'pending' || !jobStatus) && currentStep === 1 && t('status.classificationComplete')}
                          {(jobStatus === 'pending' || !jobStatus) && currentStep === 2 && t('status.lintingComplete')}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-gray-400">
                          {t('status.step', { current: currentStep, total: 3 })}
                        </span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs text-gray-400">
                            {currentStep === 0 && t('status.remainingStart')}
                            {currentStep === 1 && t('status.remainingClassification')}
                            {currentStep === 2 && t('status.remainingLinting')}
                            {currentStep === 3 && t('status.remainingStoryboarding')}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 animate-pulse">
                        <div className="h-10 bg-gray-800/50 rounded"></div>
                        <div className="h-20 bg-gray-800/30 rounded"></div>
                        <div className="h-16 bg-gray-800/30 rounded"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Usage Limit Banner - Only shown for anonymous trial users */}
                    {analysisData && userTier === 'anonymous' && (
                      <UsageLimitBanner
                        tier={userTier}
                        remaining={analysesRemaining}
                      />
                    )}

                    {/* Overall Score */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{t('scores.overall')}</div>
                        <div className="relative group">
                          <InfoIcon className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400 cursor-help transition-colors" />
                          {(() => {
                            const fmt = (analysisData?.storyboard?._format || analysisData?.classification?.format || 'talking_head') as VideoFormat;
                            const weights = NICHE_WEIGHTS[fmt] || NICHE_WEIGHTS.talking_head;
                            return (
                              <div className="absolute left-0 top-6 w-72 bg-gray-900 border border-gray-700 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl">
                                <div className="text-xs text-gray-300 space-y-2">
                                  <p className="font-semibold text-white">{t('scores.howCalculated')}</p>
                                  <p>{t('scores.calculationExplanation')}</p>
                                  <ul className="space-y-1 pl-3">
                                    <li className="flex items-start gap-1.5">
                                      <span className="text-orange-500 mt-0.5">•</span>
                                      <span>{t('scores.hookWeight', { percent: Math.round(weights.hook * 100) })}</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <span className="text-green-500 mt-0.5">•</span>
                                      <span>{t('scores.structureWeight', { percent: Math.round(weights.structure * 100) })}</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <span className="text-purple-500 mt-0.5">•</span>
                                      <span>{t('scores.clarityWeight', { percent: Math.round(weights.clarity * 100) })}</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <span className="text-blue-500 mt-0.5">•</span>
                                      <span>{t('scores.deliveryWeight', { percent: Math.round(weights.delivery * 100) })}</span>
                                    </li>
                                  </ul>
                                  <p className="pt-2 border-t border-gray-800 text-[11px] text-gray-400">
                                    <span className="font-medium text-gray-300">{t('scores.deterministic')}</span>
                                  </p>
                                  <p className="pt-2 border-t border-gray-800 text-[11px]">
                                    {t('scores.grades')}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {(() => {
                        if (!analysisData) return null;
                        const score = Math.round(analysisData.lintSummary.score);
                        const grade = getLetterGrade(score);
                        return (
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`text-4xl font-bold text-${grade.color}-500`}>{grade.label}</span>
                            <span className={`text-sm text-${grade.color}-400`}>{grade.comment}</span>
                          </div>
                        );
                      })()}
                      {(() => {
                        if (!analysisData) return null;
                        // Count perfect beats (no issues)
                        const perfectBeats = analysisData.storyboard.beats.filter(
                          (beat: any) => !beat.retention?.issues || beat.retention.issues.length === 0
                        ).length;
                        const totalBeats = analysisData.storyboard.beats.length;

                        if (perfectBeats === 0) return null;

                        return (
                          <div className="mb-3 p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-green-500 text-lg">✓</span>
                              <span className="text-sm text-green-400">
                                {t('scores.perfectBeats', { perfect: perfectBeats, total: totalBeats })}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="pt-3 border-t border-gray-800">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">{t('director.take')}</div>
                        <div className="text-xs text-gray-400 leading-relaxed space-y-2">
                          {(() => {
                            if (!analysisData) return null;
                            const text = analysisData.storyboard.performance.directorAssessment;
                            const lines = text.split('\n').filter(line => line.trim().length > 0);

                            // Helper to parse inline backticks into styled spans
                            const parseInlineCode = (str: string) => {
                              const parts = str.split(/(`[^`]+`)/g);
                              return parts.map((part, i) => {
                                if (part.startsWith('`') && part.endsWith('`')) {
                                  const code = part.slice(1, -1);
                                  return (
                                    <span key={i} className="px-1 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[11px] font-mono">
                                      {code}
                                    </span>
                                  );
                                }
                                return part;
                              });
                            };

                            return lines.map((line, idx) => {
                              const trimmedLine = line.trim();

                              // Bullet point (starts with •)
                              if (trimmedLine.startsWith('•')) {
                                return (
                                  <div key={idx} className="flex gap-2 ml-2">
                                    <span className="text-gray-600 mt-0.5">•</span>
                                    <span className="text-gray-400">{parseInlineCode(trimmedLine.substring(1).trim())}</span>
                                  </div>
                                );
                              }

                              // Main diagnosis line (not a bullet)
                              return (
                                <div key={idx} className="text-gray-300 font-medium">
                                  {parseInlineCode(trimmedLine)}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Format Badge + Guidance */}
                      {(() => {
                        const videoFormat = (analysisData.storyboard._format || analysisData.classification?.format || 'other') as VideoFormat;
                        const formatColors: Record<string, string> = {
                          talking_head: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                          gameplay: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                          demo: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                          other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                        };
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-800">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">{t('format.label')}</div>
                            <span className={`inline-block px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${formatColors[videoFormat] || formatColors.other}`}>
                              {t(`format.${videoFormat}` as any)}
                            </span>
                            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                              {t(`format.guidance.${videoFormat}` as any)}
                            </p>
                          </div>
                        );
                      })()}

                      {/* Niche Category */}
                      {analysisData.storyboard.overview.nicheCategory && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">{t('director.niche')}</div>
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

                      {/* Content Type */}
                      {analysisData.storyboard.performance.content.contentType && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">{t('director.contentType')}</div>
                          <span className="inline-block px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-[10px] font-semibold uppercase tracking-wide w-fit">
                            {analysisData.storyboard.performance.content.contentType}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Analysis Cards Grid */}
                {loading ? (
                  <div className="grid grid-cols-4 gap-3 items-start">
                    {/* Loading skeletons for 4 cards */}
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 animate-pulse">
                        <div className="h-4 bg-gray-800/50 rounded mb-3 w-16"></div>
                        <div className="h-8 bg-gray-800/50 rounded mb-2"></div>
                        <div className="h-1 bg-gray-800/50 rounded mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-800/30 rounded"></div>
                          <div className="h-4 bg-gray-800/30 rounded"></div>
                          <div className="h-4 bg-gray-800/30 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3 items-start">
                    {/* Hook Card */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{t('metrics.hook.title')}</span>
                        <button
                          onClick={() => setHookExpanded(!hookExpanded)}
                          className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                        >
                          {hookExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                        </button>
                      </div>
                      {(() => {
                        if (!analysisData) return null;
                        const hookScore = Math.min(Math.round(analysisData.storyboard.performance.hookStrength), 100);
                        const grade = getLetterGrade(hookScore);
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-2xl font-bold text-${grade.color}-500`}>{grade.label}</span>
                            </div>

                            {/* Always show metrics */}
                            <div
                              className={`space-y-2 text-xs mb-3 ${shouldBlur ? 'blur-sm cursor-pointer select-none' : ''
                                }`}
                              onClick={() => {
                                if (shouldBlur) {
                                  setUpgradeFeature('performance-cards');
                                  setShowUpgradeModal(true);
                                }
                              }}
                              style={shouldBlur ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                            >
                              {analysisData.storyboard._signals?.hook ? (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.hook.timeToClaim')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.hook.tooltips.timeToClaim')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.hook.TTClaim <= 1.5 ? 'text-green-400' : analysisData.storyboard._signals.hook.TTClaim <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.hook.TTClaim}s
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.hook.patternBreak')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.hook.tooltips.patternBreak')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.hook.PB >= 4 ? 'text-green-400' : analysisData.storyboard._signals.hook.PB >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.hook.PB}/5
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.hook.specifics')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.hook.tooltips.specifics')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.hook.Spec >= 2 ? 'text-green-400' : analysisData.storyboard._signals.hook.Spec >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {t('found', { count: analysisData.storyboard._signals.hook.Spec })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.hook.hookQuestion')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.hook.tooltips.hookQuestion')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.hook.QC > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                      {analysisData.storyboard._signals.hook.QC > 0 ? tCommon('yes') : tCommon('no')}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">{t('metrics.hook.duration')}</span>
                                    <span className="text-white font-semibold">{analysisData.storyboard.performance.hook.duration}s</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">{t('metrics.hook.viralPattern')}</span>
                                    <span className={`text-${getMetricLabel(analysisData.storyboard.performance.hook.viralPattern).color}-400 font-semibold`}>{getMetricLabel(analysisData.storyboard.performance.hook.viralPattern).label}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">{t('metrics.hook.loopStrength')}</span>
                                    <span className={`text-${getMetricLabel(analysisData.storyboard.performance.hook.loopStrength).color}-400 font-semibold`}>{getMetricLabel(analysisData.storyboard.performance.hook.loopStrength).label}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Hook Category Badge + Pattern */}
                            {analysisData.storyboard.overview.hookCategory && (
                              <div className="space-y-1.5 mb-3">
                                <span className="inline-block px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-[10px] font-semibold uppercase tracking-wide">
                                  {(() => {
                                    const cat = analysisData.storyboard.overview.hookCategory;
                                    // Use raw labels from next-intl if available
                                    try {
                                      return t(`hooks.types.${cat}.label`);
                                    } catch (e) {
                                      return cat;
                                    }
                                  })()}
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
                              <div
                                className={`pt-3 border-t border-gray-800 ${shouldBlur ? 'blur-sm cursor-pointer select-none' : ''
                                  }`}
                                onClick={() => {
                                  if (shouldBlur) {
                                    setUpgradeFeature('performance-cards');
                                    setShowUpgradeModal(true);
                                  }
                                }}
                                style={shouldBlur ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                              >
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
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{t('metrics.structure.title')}</span>
                        <button
                          onClick={() => setStructureExpanded(!structureExpanded)}
                          className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                        >
                          {structureExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                        </button>
                      </div>
                      {(() => {
                        if (!analysisData) return null;
                        const structureScore = Math.min(Math.round(analysisData.storyboard.performance.structurePacing), 100);
                        const grade = getLetterGrade(structureScore);
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-2xl font-bold text-${grade.color}-500`}>{grade.label}</span>
                            </div>

                            {/* Always show metrics */}
                            <div
                              className={`space-y-2 text-xs mb-3 ${shouldBlur ? 'blur-sm cursor-pointer select-none' : ''
                                }`}
                              onClick={() => {
                                if (shouldBlur) {
                                  setUpgradeFeature('performance-cards');
                                  setShowUpgradeModal(true);
                                }
                              }}
                              style={shouldBlur ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                            >
                              {analysisData.storyboard._signals?.structure ? (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.structure.beatCount')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.structure.tooltips.beatCount')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.structure.BC >= 3 && analysisData.storyboard._signals.structure.BC <= 6 ? 'text-green-400' : 'text-yellow-400'}`}>
                                      {t('metrics.structure.beats', { count: analysisData.storyboard._signals.structure.BC })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.structure.progressMarkers')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.structure.tooltips.progressMarkers')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.structure.PM >= 2 ? 'text-green-400' : analysisData.storyboard._signals.structure.PM >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {t('found', { count: analysisData.storyboard._signals.structure.PM })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.structure.hasPayoff')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.structure.tooltips.hasPayoff')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.structure.PP ? 'text-green-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.structure.PP ? tCommon('yes') : tCommon('no')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.structure.loopCue')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.structure.tooltips.loopCue')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.structure.LC ? 'text-green-400' : 'text-gray-400'}`}>
                                      {analysisData.storyboard._signals.structure.LC ? tCommon('yes') : tCommon('no')}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">{t('metrics.structure.videoLength')}</span>
                                    <span className="text-white font-semibold">{analysisData.storyboard.performance.structure.videoLength}s</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">{t('metrics.structure.pacingConsistency')}</span>
                                    <span className={`text-${getMetricLabel(analysisData.storyboard.performance.structure.pacingConsistency).color}-400 font-semibold`}>{getMetricLabel(analysisData.storyboard.performance.structure.pacingConsistency).label}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">{t('metrics.structure.payoffTiming')}</span>
                                    <span className={`text-${getMetricLabel(analysisData.storyboard.performance.structure.payoffTiming).color}-400 font-semibold`}>{getMetricLabel(analysisData.storyboard.performance.structure.payoffTiming).label}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Only analysis is collapsible */}
                            {structureExpanded && (
                              <div
                                className={`pt-3 border-t border-gray-800 ${shouldBlur ? 'blur-sm cursor-pointer select-none' : ''
                                  }`}
                                onClick={() => {
                                  if (shouldBlur) {
                                    setUpgradeFeature('performance-cards');
                                    setShowUpgradeModal(true);
                                  }
                                }}
                                style={shouldBlur ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                              >
                                {renderAnalysis(analysisData.storyboard.performance.structure.analysis)}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Clarity Card */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{t('metrics.clarity.title')}</span>
                        <button
                          onClick={() => setClarityExpanded(!clarityExpanded)}
                          className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                        >
                          {clarityExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                        </button>
                      </div>
                      {(() => {
                        if (!analysisData) return null;
                        // Use valueClarity for the clarity grade
                        const clarityScore = analysisData.storyboard.performance.content.valueClarity;
                        const grade = getClarityGrade(clarityScore);
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-xl font-bold text-${grade.color}-500`}>{grade.label}</span>
                            </div>

                            {/* Always show metrics */}
                            <div
                              className={`space-y-2 text-xs mb-3 ${shouldBlur ? 'blur-sm cursor-pointer select-none' : ''
                                }`}
                              onClick={() => {
                                if (shouldBlur) {
                                  setUpgradeFeature('performance-cards');
                                  setShowUpgradeModal(true);
                                }
                              }}
                              style={shouldBlur ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                            >
                              {analysisData.storyboard._signals?.clarity ? (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.clarity.speakingPace')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.clarity.tooltips.speakingPace')}
                                      </span>
                                    </span>
                                    {(() => {
                                      const wps = analysisData.storyboard._signals!.clarity.wordCount / analysisData.storyboard._signals!.clarity.duration;
                                      const isGood = wps >= 3 && wps <= 4;
                                      const isOk = wps >= 2.5 && wps <= 4.5;
                                      return (
                                        <span className={`font-semibold ${isGood ? 'text-green-400' : isOk ? 'text-yellow-400' : 'text-red-400'}`}>
                                          {wps.toFixed(1)} w/s
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.clarity.complexity')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.clarity.tooltips.complexity')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.clarity.SC <= 2 ? 'text-green-400' : analysisData.storyboard._signals.clarity.SC <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.clarity.SC}/5
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.clarity.topicJumps')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.clarity.tooltips.topicJumps')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.clarity.TJ === 0 ? 'text-green-400' : analysisData.storyboard._signals.clarity.TJ <= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.clarity.TJ}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.clarity.redundancy')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.clarity.tooltips.redundancy')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.clarity.RD <= 2 ? 'text-green-400' : analysisData.storyboard._signals.clarity.RD <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.clarity.RD}/5
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Clarity Score</span>
                                    <span className={`font-semibold ${clarityScore >= 80 ? 'text-green-400' : clarityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {clarityScore}%
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Only analysis is collapsible */}
                            {clarityExpanded && (
                              <div
                                className={`pt-3 border-t border-gray-800 ${shouldBlur ? 'blur-sm cursor-pointer select-none' : ''
                                  }`}
                                onClick={() => {
                                  if (shouldBlur) {
                                    setUpgradeFeature('performance-cards');
                                    setShowUpgradeModal(true);
                                  }
                                }}
                                style={shouldBlur ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                              >
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
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{t('metrics.delivery.title')}</span>
                        <button
                          onClick={() => setDeliveryExpanded(!deliveryExpanded)}
                          className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                        >
                          {deliveryExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                        </button>
                      </div>
                      {(() => {
                        if (!analysisData) return null;
                        const deliveryScore = Math.min(Math.round(analysisData.storyboard.performance.deliveryPerformance), 100);
                        const grade = getLetterGrade(deliveryScore);
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-2xl font-bold text-${grade.color}-500`}>{grade.label}</span>
                            </div>

                            {/* Always show metrics */}
                            <div
                              className={`space-y-2 text-xs mb-3 ${shouldBlur ? 'blur-sm cursor-pointer select-none' : ''
                                }`}
                              onClick={() => {
                                if (shouldBlur) {
                                  setUpgradeFeature('performance-cards');
                                  setShowUpgradeModal(true);
                                }
                              }}
                              style={shouldBlur ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                            >
                              {analysisData.storyboard._signals?.delivery ? (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.delivery.volumeConsistency')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.delivery.tooltips.volumeConsistency')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.delivery.LS >= 4 ? 'text-green-400' : analysisData.storyboard._signals.delivery.LS >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.delivery.LS}/5
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.delivery.audioQuality')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.delivery.tooltips.audioQuality')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.delivery.NS >= 4 ? 'text-green-400' : analysisData.storyboard._signals.delivery.NS >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.delivery.NS}/5
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.delivery.fillerWords')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.delivery.tooltips.fillerWords')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.delivery.fillerCount === 0 ? 'text-green-400' : analysisData.storyboard._signals.delivery.fillerCount <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.delivery.fillerCount}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 cursor-help group relative">
                                      {t('metrics.delivery.energyVariation')}
                                      <span className="absolute bottom-full left-0 mb-1 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {t('metrics.delivery.tooltips.energyVariation')}
                                      </span>
                                    </span>
                                    <span className={`font-semibold ${analysisData.storyboard._signals.delivery.EC ? 'text-green-400' : 'text-red-400'}`}>
                                      {analysisData.storyboard._signals.delivery.EC ? tCommon('yes') : tCommon('no')}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Energy Level</span>
                                    <span className={`text-${getMetricLabel(analysisData.storyboard.performance.delivery.energyLevel).color}-400 font-semibold`}>{getMetricLabel(analysisData.storyboard.performance.delivery.energyLevel).label}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Vocal Clarity</span>
                                    <span className={`text-${getMetricLabel(analysisData.storyboard.performance.delivery.vocalClarity).color}-400 font-semibold`}>{getMetricLabel(analysisData.storyboard.performance.delivery.vocalClarity).label}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Presence</span>
                                    <span className={`text-${getMetricLabel(analysisData.storyboard.performance.delivery.presence).color}-400 font-semibold`}>{getMetricLabel(analysisData.storyboard.performance.delivery.presence).label}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Only analysis is collapsible */}
                            {deliveryExpanded && (
                              <div
                                className={`pt-3 border-t border-gray-800 ${shouldBlur ? 'blur-sm cursor-pointer select-none' : ''
                                  }`}
                                onClick={() => {
                                  if (shouldBlur) {
                                    setUpgradeFeature('performance-cards');
                                    setShowUpgradeModal(true);
                                  }
                                }}
                                style={shouldBlur ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                              >
                                {renderAnalysis(analysisData.storyboard.performance.delivery.analysis)}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Retention Curve Chart */}
            {retentionLoading && analysisData && (
              <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="h-3 w-48 bg-gray-800 rounded animate-pulse mb-4" />
                <div className="h-[200px] bg-gray-800/50 rounded animate-pulse" />
              </div>
            )}
            {!retentionLoading && retentionCurve && retentionCurve.curveData && retentionCurve.curveData.length > 0 && analysisData && (
              <div className="mb-8">
                <RetentionCurveChart
                  curveData={retentionCurve.curveData}
                  videoDuration={videoStats?.duration || analysisData.storyboard.beats[analysisData.storyboard.beats.length - 1]?.endTime || 60}
                  beats={analysisData.storyboard.beats.map((b: Beat) => ({
                    beatNumber: b.beatNumber,
                    startTime: b.startTime,
                  }))}
                  isFresh={retentionCurve.isFresh}
                  fetchedAt={retentionCurve.fetchedAt}
                  onRefresh={handleRetentionRefresh}
                  refreshing={retentionRefreshing}
                />
              </div>
            )}

            {/* Prioritized Action List */}
            {!loading && analysisData && (criticalCount > 0 || moderateCount > 0 || minorCount > 0) && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-6">{t('whatToFix.title')}</h3>

                {/* Critical Fixes */}
                {criticalCount > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <h4 className="text-base font-semibold text-red-500">{t('whatToFix.critical.title')}</h4>
                      <span className="text-sm text-gray-500">{t('whatToFix.critical.subtitle')}</span>
                    </div>
                    <div className="space-y-2">
                      {groupedIssuesList
                        .filter(i => i.severity === 'critical')
                        .map((issue, idx) => (
                          <button
                            key={idx}
                            onClick={() => scrollToBeat(issue.firstBeatNumber)}
                            className="w-full text-left bg-red-500/5 border border-red-500/20 rounded-lg p-4 hover:bg-red-500/10 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <XCircle className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono text-gray-500">
                                    {issue.beatNumbers.length > 1
                                      ? t('whatToFix.beats', { numbers: issue.beatNumbers.join(', ') })
                                      : t('whatToFix.beat', { number: issue.beatNumbers[0] })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-200 mb-1">{issue.message}</p>
                                {issue.suggestion && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    💡 {issue.suggestion}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <span className="text-xs text-gray-600 group-hover:text-orange-500 transition-colors">
                                  {t('whatToFix.view')}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Secondary Improvements */}
                {moderateCount > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <h4 className="text-base font-semibold text-orange-500">{t('whatToFix.moderate.title')}</h4>
                    </div>
                    <div className="space-y-2">
                      {groupedIssuesList
                        .filter(i => i.severity === 'moderate')
                        .map((issue, idx) => (
                          <button
                            key={idx}
                            onClick={() => scrollToBeat(issue.firstBeatNumber)}
                            className="w-full text-left bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 hover:bg-orange-500/10 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono text-gray-500">
                                    {issue.beatNumbers.length > 1
                                      ? t('whatToFix.beats', { numbers: issue.beatNumbers.join(', ') })
                                      : t('whatToFix.beat', { number: issue.beatNumbers[0] })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-200 mb-1">{issue.message}</p>
                                {issue.suggestion && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    💡 {issue.suggestion}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <span className="text-xs text-gray-600 group-hover:text-orange-500 transition-colors">
                                  {t('whatToFix.view')}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Optional Polish */}
                {minorCount > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      <h4 className="text-base font-semibold text-blue-500">{t('whatToFix.minor.title')}</h4>
                    </div>
                    <div className="space-y-2">
                      {groupedIssuesList
                        .filter(i => i.severity === 'minor')
                        .map((issue, idx) => (
                          <button
                            key={idx}
                            onClick={() => scrollToBeat(issue.firstBeatNumber)}
                            className="w-full text-left bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 hover:bg-blue-500/10 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <InfoIcon className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono text-gray-500">
                                    {issue.beatNumbers.length > 1
                                      ? t('whatToFix.beats', { numbers: issue.beatNumbers.join(', ') })
                                      : t('whatToFix.beat', { number: issue.beatNumbers[0] })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-200 mb-1">{issue.message}</p>
                                {issue.suggestion && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    💡 {issue.suggestion}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <span className="text-xs text-gray-600 group-hover:text-orange-500 transition-colors">
                                  {t('whatToFix.view')}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Next Step CTA */}
            {!loading && allIssues.length > 0 && (
              <div className="mb-8 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-white mb-1">{t('nextStep.title')}</h4>
                    <p className="text-sm text-gray-400 mb-3">{t('nextStep.description')}</p>
                    <div className="text-xs text-gray-500 mb-2 font-medium">{t('nextStep.howItWorks')}</div>
                    <div className="flex flex-col gap-1.5 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex-shrink-0 w-5 h-5 bg-violet-500/20 rounded-full flex items-center justify-center text-[10px] font-bold text-violet-400">1</span>
                        {t('nextStep.step1')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex-shrink-0 w-5 h-5 bg-violet-500/20 rounded-full flex items-center justify-center text-[10px] font-bold text-violet-400">2</span>
                        {t('nextStep.step2')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex-shrink-0 w-5 h-5 bg-violet-500/20 rounded-full flex items-center justify-center text-[10px] font-bold text-violet-400">3</span>
                        {t('nextStep.step3')}
                      </div>
                    </div>
                    {approvedChangesCollapsed && (
                      <button
                        onClick={() => setApprovedChangesCollapsed(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-sm font-medium text-violet-300 transition-colors"
                      >
                        <PanelRightOpen className="w-4 h-4" />
                        {t('nextStep.openSidebar')}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Beat-by-Beat Breakdown */}
            {loading ? (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">{t('beatsbybeat.title')}</h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-lg">
                    <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                    <span className="text-sm text-orange-500 font-medium">{t('status.analyzing')}</span>
                  </div>
                </div>
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                      <div className="space-y-3">
                        <div className="h-5 bg-gray-800/50 rounded w-32"></div>
                        <div className="h-4 bg-gray-800/30 rounded w-full"></div>
                        <div className="h-4 bg-gray-800/30 rounded w-3/4"></div>
                        <div className="h-16 bg-gray-800/20 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">{t('beatsbybeat.title')}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{t('beatsbybeat.beatsCount', { count: analysisData?.storyboard.beats.length || 0 })}</span>
                    {criticalCount > 0 && (
                      <div className="group relative">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 rounded-lg cursor-help">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-sm font-semibold text-red-500">{criticalCount}</span>
                        </div>
                        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-800 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                          <div className="text-xs font-semibold text-red-500 mb-2">{t('beatsbybeat.severity.critical')} ({criticalCount})</div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {allIssues.filter(i => i.severity === 'critical').map((issue, idx) => (
                              <div key={idx} className="text-xs text-gray-400">
                                <span className="text-gray-500">{t('beatsbybeat.beatMini', { number: issue.beatNumber })}:</span> {issue.message}
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
                          <div className="text-xs font-semibold text-orange-500 mb-2">{t('beatsbybeat.severity.moderate')} ({moderateCount})</div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {allIssues.filter(i => i.severity === 'moderate').map((issue, idx) => (
                              <div key={idx} className="text-xs text-gray-400">
                                <span className="text-gray-500">{t('beatsbybeat.beatMini', { number: issue.beatNumber })}:</span> {issue.message}
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
                          <div className="text-xs font-semibold text-blue-500 mb-2">{t('beatsbybeat.severity.minor')} ({minorCount})</div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {allIssues.filter(i => i.severity === 'minor').map((issue, idx) => (
                              <div key={idx} className="text-xs text-gray-400">
                                <span className="text-gray-500">{t('beatsbybeat.beatMini', { number: issue.beatNumber })}:</span> {issue.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {criticalCount === 0 && moderateCount === 0 && minorCount === 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm font-semibold text-green-500">{t('beatsbybeat.noIssues')}</span>
                      </div>
                    )}
                  </div>
                </div>

                  <div className="space-y-4">
                    {analysisData?.storyboard.beats.filter((beat) => beat.beatNumber === 1).map((beat) => (
                      <div
                        key={beat.beatNumber}
                        ref={(el) => { beatRefs.current[beat.beatNumber] = el; }}
                        className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 transition-colors duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500 font-semibold">{t('whatToFix.beat', { number: beat.beatNumber })}</span>
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
                            </div>
                            <h4 className="font-medium text-white mb-3">{beat.title}</h4>

                            <div className="space-y-2 mb-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('beatsbybeat.transcript')}</div>
                                <p className="text-sm text-gray-300">"{beat.transcript}"</p>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('beatsbybeat.visual')}</div>
                                <p className="text-sm text-gray-300">{beat.visual}</p>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('beatsbybeat.audio')}</div>
                                <p className="text-sm text-gray-300">{beat.audio}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`mb-3 ${shouldBlur && beat.beatNumber > 1 ? 'blur-sm cursor-pointer select-none' : ''
                            }`}
                          onClick={() => {
                            if (shouldBlur && beat.beatNumber > 1) {
                              setUpgradeFeature('performance-cards');
                              setShowUpgradeModal(true);
                            }
                          }}
                          style={shouldBlur && beat.beatNumber > 1 ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                        >
                          <div className="text-xs text-gray-500 mb-1">{t('beatsbybeat.retentionDrop')}</div>
                          <div className={`text-sm font-semibold ${beat.retention?.issues?.some(i => i.severity === 'critical')
                            ? 'text-red-500'
                            : beat.retention?.issues?.some(i => i.severity === 'moderate')
                              ? 'text-orange-500'
                              : beat.retention?.issues?.some(i => i.severity === 'minor')
                                ? 'text-blue-500'
                                : 'text-green-500'
                            }`}>
                            {beat.retention?.issues?.some(i => i.severity === 'critical')
                              ? t('beatsbybeat.retention.high')
                              : beat.retention?.issues?.some(i => i.severity === 'moderate')
                                ? t('beatsbybeat.retention.moderate')
                                : beat.retention?.issues?.some(i => i.severity === 'minor')
                                  ? t('beatsbybeat.retention.minor')
                                  : t('beatsbybeat.retention.strong')}
                          </div>
                        </div>
                        {(beat.retention?.issues?.length ?? 0) > 0 ? (
                          <div
                            className={`space-y-2 ${shouldBlur && beat.beatNumber > 1 ? 'blur-sm cursor-pointer select-none' : ''
                              }`}
                            onClick={() => {
                              if (shouldBlur && beat.beatNumber > 1) {
                                setUpgradeFeature('performance-cards');
                                setShowUpgradeModal(true);
                              }
                            }}
                            style={shouldBlur && beat.beatNumber > 1 ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                          >
                            {beat.retention?.issues?.map((issue, idx) => {
                              // Get effective severity (respecting user preferences)
                              const effectiveSeverity = getEffectiveSeverity({
                                ruleId: (issue as any).ruleId,
                                message: issue.message,
                                severity: issue.severity,
                              });

                              const isAlreadyApproved = approvedChanges.some(
                                change =>
                                  change.type === 'fix' &&
                                  change.beatNumber === beat.beatNumber &&
                                  change.issue?.suggestion === issue.suggestion
                              );

                              const issueHasPreference = hasPreference({
                                ruleId: (issue as any).ruleId,
                                message: issue.message,
                              });

                              const severityColors = getSeverityColor(effectiveSeverity);
                              const isIgnored = effectiveSeverity === 'ignored';

                              return (
                                <div
                                  key={idx}
                                  className={`border rounded-lg p-4 ${severityColors.border} ${severityColors.bg} ${issueHasPreference ? 'ring-1 ring-purple-500/40' : ''
                                    } ${isIgnored ? 'opacity-60 grayscale' : ''}`}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Severity Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                      {getSeverityIcon(effectiveSeverity, "w-4 h-4")}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      {/* Header: Severity + Vote Buttons + Timestamp + Rule Badge */}
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-[10px] font-bold uppercase ${severityColors.text}`}>
                                          {t(`beatsbybeat.severity.${effectiveSeverity as 'critical' | 'moderate' | 'minor' | 'ignored'}`)}
                                        </span>
                                        {/* Severity Vote Buttons */}
                                        <SeverityVoteButtons
                                          currentSeverity={effectiveSeverity}
                                          originalSeverity={issue.severity}
                                          isLoggedIn={isLoggedIn}
                                          onVoteUp={() => voteUp({
                                            ruleId: (issue as any).ruleId,
                                            message: issue.message,
                                            severity: issue.severity,
                                          })}
                                          onVoteDown={() => voteDown({
                                            ruleId: (issue as any).ruleId,
                                            message: issue.message,
                                            severity: issue.severity,
                                          })}
                                          onReset={() => resetPreference({
                                            ruleId: (issue as any).ruleId,
                                            message: issue.message,
                                          })}
                                          disabled={shouldDisableButtons}
                                        />
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
                                        {(issue as any).ruleId ? (
                                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-medium">
                                            {(issue as any).ruleName || (issue as any).ruleId}
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-medium">
                                            AI Analysis
                                          </span>
                                        )}
                                      </div>

                                      {/* Issue Message */}
                                      <p className={`text-sm mb-3 ${isIgnored ? 'text-gray-500' : 'text-gray-200'}`}>{issue.message}</p>

                                      {/* Suggestion + Apply Fix Button */}
                                      {issue.suggestion && (
                                        <div className="space-y-2">
                                          <p className={`text-xs ${isIgnored ? 'text-gray-600' : 'text-gray-400'}`}>
                                            💡 {issue.suggestion}
                                          </p>
                                          <button
                                            onClick={() => {
                                              if (shouldDisableButtons) {
                                                setUpgradeFeature('apply-fix');
                                                setShowUpgradeModal(true);
                                                return;
                                              }
                                              if (!isAlreadyApproved) {
                                                approveFix(beat.beatNumber, beat.title, issue);
                                              }
                                            }}
                                            disabled={isAlreadyApproved}
                                            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${isAlreadyApproved || shouldDisableButtons
                                              ? 'text-gray-500 bg-gray-800 border border-gray-700 cursor-not-allowed opacity-50'
                                              : 'text-green-500 hover:text-white bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500'
                                              }`}
                                          >
                                            {isAlreadyApproved ? t('whatToFix.applied') : t('whatToFix.apply')}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            className={`flex items-start gap-3 bg-green-500/5 border border-green-500/20 rounded-lg p-4 ${shouldBlur && beat.beatNumber > 1 ? 'blur-sm cursor-pointer select-none' : ''
                              }`}
                            onClick={() => {
                              if (shouldBlur && beat.beatNumber > 1) {
                                setUpgradeFeature('performance-cards');
                                setShowUpgradeModal(true);
                              }
                            }}
                            style={shouldBlur && beat.beatNumber > 1 ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-green-500 uppercase mb-1">No Issues</div>
                              <p className="text-sm text-gray-400 leading-relaxed">{beat.retention?.analysis || 'No analysis available'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Expand/Collapse toggle after Beat 1 */}
                    {(analysisData?.storyboard.beats.length ?? 0) > 1 && (
                      <button
                        onClick={() => setBeatBreakdownCollapsed(!beatBreakdownCollapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800/30 hover:bg-gray-800/60 border border-gray-800 rounded-xl transition-colors text-sm text-gray-400 hover:text-gray-300"
                      >
                        {beatBreakdownCollapsed ? (
                          <>
                            <span>{t('beatsbybeat.showMoreBeats', { count: (analysisData?.storyboard.beats.length ?? 1) - 1 })}</span>
                            <ChevronDown className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>{t('beatsbybeat.collapseBeats')}</span>
                            <ChevronUp className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}

                    {/* Remaining beats */}
                    {!beatBreakdownCollapsed && analysisData?.storyboard.beats.filter((beat) => beat.beatNumber > 1).map((beat) => (
                      <div
                        key={beat.beatNumber}
                        ref={(el) => { beatRefs.current[beat.beatNumber] = el; }}
                        className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 transition-colors duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500 font-semibold">{t('whatToFix.beat', { number: beat.beatNumber })}</span>
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
                            </div>
                            <h4 className="font-medium text-white mb-3">{beat.title}</h4>

                            <div className="space-y-2 mb-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('beatsbybeat.transcript')}</div>
                                <p className="text-sm text-gray-300">"{beat.transcript}"</p>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('beatsbybeat.visual')}</div>
                                <p className="text-sm text-gray-300">{beat.visual}</p>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('beatsbybeat.audio')}</div>
                                <p className="text-sm text-gray-300">{beat.audio}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`mb-3 ${shouldBlur && beat.beatNumber > 1 ? 'blur-sm cursor-pointer select-none' : ''
                            }`}
                          onClick={() => {
                            if (shouldBlur && beat.beatNumber > 1) {
                              setUpgradeFeature('performance-cards');
                              setShowUpgradeModal(true);
                            }
                          }}
                          style={shouldBlur && beat.beatNumber > 1 ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                        >
                          <div className="text-xs text-gray-500 mb-1">{t('beatsbybeat.retentionDrop')}</div>
                          <div className={`text-sm font-semibold ${beat.retention?.issues?.some(i => i.severity === 'critical')
                            ? 'text-red-500'
                            : beat.retention?.issues?.some(i => i.severity === 'moderate')
                              ? 'text-orange-500'
                              : beat.retention?.issues?.some(i => i.severity === 'minor')
                                ? 'text-blue-500'
                                : 'text-green-500'
                            }`}>
                            {beat.retention?.issues?.some(i => i.severity === 'critical')
                              ? t('beatsbybeat.retention.high')
                              : beat.retention?.issues?.some(i => i.severity === 'moderate')
                                ? t('beatsbybeat.retention.moderate')
                                : beat.retention?.issues?.some(i => i.severity === 'minor')
                                  ? t('beatsbybeat.retention.minor')
                                  : t('beatsbybeat.retention.strong')}
                          </div>
                        </div>
                        {(beat.retention?.issues?.length ?? 0) > 0 ? (
                          <div
                            className={`space-y-2 ${shouldBlur && beat.beatNumber > 1 ? 'blur-sm cursor-pointer select-none' : ''
                              }`}
                            onClick={() => {
                              if (shouldBlur && beat.beatNumber > 1) {
                                setUpgradeFeature('performance-cards');
                                setShowUpgradeModal(true);
                              }
                            }}
                            style={shouldBlur && beat.beatNumber > 1 ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                          >
                            {beat.retention?.issues?.map((issue, idx) => {
                              // Get effective severity (respecting user preferences)
                              const effectiveSeverity = getEffectiveSeverity({
                                ruleId: (issue as any).ruleId,
                                message: issue.message,
                                severity: issue.severity,
                              });

                              const isAlreadyApproved = approvedChanges.some(
                                change =>
                                  change.type === 'fix' &&
                                  change.beatNumber === beat.beatNumber &&
                                  change.issue?.suggestion === issue.suggestion
                              );

                              const issueHasPreference = hasPreference({
                                ruleId: (issue as any).ruleId,
                                message: issue.message,
                              });

                              const severityColors = getSeverityColor(effectiveSeverity);
                              const isIgnored = effectiveSeverity === 'ignored';

                              return (
                                <div
                                  key={idx}
                                  className={`border rounded-lg p-4 ${severityColors.border} ${severityColors.bg} ${issueHasPreference ? 'ring-1 ring-purple-500/40' : ''
                                    } ${isIgnored ? 'opacity-60 grayscale' : ''}`}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Severity Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                      {getSeverityIcon(effectiveSeverity, "w-4 h-4")}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      {/* Header: Severity + Vote Buttons + Timestamp + Rule Badge */}
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-[10px] font-bold uppercase ${severityColors.text}`}>
                                          {t(`beatsbybeat.severity.${effectiveSeverity as 'critical' | 'moderate' | 'minor' | 'ignored'}`)}
                                        </span>
                                        {/* Severity Vote Buttons */}
                                        <SeverityVoteButtons
                                          currentSeverity={effectiveSeverity}
                                          originalSeverity={issue.severity}
                                          isLoggedIn={isLoggedIn}
                                          onVoteUp={() => voteUp({
                                            ruleId: (issue as any).ruleId,
                                            message: issue.message,
                                            severity: issue.severity,
                                          })}
                                          onVoteDown={() => voteDown({
                                            ruleId: (issue as any).ruleId,
                                            message: issue.message,
                                            severity: issue.severity,
                                          })}
                                          onReset={() => resetPreference({
                                            ruleId: (issue as any).ruleId,
                                            message: issue.message,
                                          })}
                                          disabled={shouldDisableButtons}
                                        />
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
                                        {(issue as any).ruleId ? (
                                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-medium">
                                            {(issue as any).ruleName || (issue as any).ruleId}
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-medium">
                                            AI Analysis
                                          </span>
                                        )}
                                      </div>

                                      {/* Issue Message */}
                                      <p className={`text-sm mb-3 ${isIgnored ? 'text-gray-500' : 'text-gray-200'}`}>{issue.message}</p>

                                      {/* Suggestion + Apply Fix Button */}
                                      {issue.suggestion && (
                                        <div className="space-y-2">
                                          <p className={`text-xs ${isIgnored ? 'text-gray-600' : 'text-gray-400'}`}>
                                            💡 {issue.suggestion}
                                          </p>
                                          <button
                                            onClick={() => {
                                              if (shouldDisableButtons) {
                                                setUpgradeFeature('apply-fix');
                                                setShowUpgradeModal(true);
                                                return;
                                              }
                                              if (!isAlreadyApproved) {
                                                approveFix(beat.beatNumber, beat.title, issue);
                                              }
                                            }}
                                            disabled={isAlreadyApproved}
                                            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${isAlreadyApproved || shouldDisableButtons
                                              ? 'text-gray-500 bg-gray-800 border border-gray-700 cursor-not-allowed opacity-50'
                                              : 'text-green-500 hover:text-white bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500'
                                              }`}
                                          >
                                            {isAlreadyApproved ? t('whatToFix.applied') : t('whatToFix.apply')}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            className={`flex items-start gap-3 bg-green-500/5 border border-green-500/20 rounded-lg p-4 ${shouldBlur && beat.beatNumber > 1 ? 'blur-sm cursor-pointer select-none' : ''
                              }`}
                            onClick={() => {
                              if (shouldBlur && beat.beatNumber > 1) {
                                setUpgradeFeature('performance-cards');
                                setShowUpgradeModal(true);
                              }
                            }}
                            style={shouldBlur && beat.beatNumber > 1 ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-green-500 uppercase mb-1">No Issues</div>
                              <p className="text-sm text-gray-400 leading-relaxed">{beat.retention?.analysis || 'No analysis available'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {/* Title & Description Suggestions */}
            {!loading && analysisData && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xl font-semibold">{t('metadata.title')}</h3>
                  {!suggestions && (
                    <button
                      onClick={() => {
                        if (shouldDisableButtons) {
                          setUpgradeFeature('suggest-metadata');
                          setShowUpgradeModal(true);
                          return;
                        }
                        handleSuggestMetadata();
                      }}
                      disabled={suggestionsLoading || shouldDisableButtons}
                      className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors ${shouldDisableButtons
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500'
                        }`}
                    >
                      {suggestionsLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('metadata.suggesting')}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {t('metadata.suggest')}
                        </>
                      )}
                    </button>
                  )}
                  {suggestions && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-semibold uppercase">
                      Generated
                    </span>
                  )}
                </div>

                {suggestionsLoading && (
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 animate-pulse">
                    <div className="space-y-4">
                      <div className="h-12 bg-gray-800/50 rounded"></div>
                      <div className="h-12 bg-gray-800/40 rounded"></div>
                      <div className="h-12 bg-gray-800/30 rounded"></div>
                      <div className="h-24 bg-gray-800/30 rounded mt-6"></div>
                    </div>
                  </div>
                )}

                {suggestions && (
                  <div className="space-y-4">
                    {/* Title Variants */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">{t('metadata.titleOptions')}</div>
                      <div className="space-y-3">
                        {suggestions.titles.map((title, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg group">
                            <span className="flex-shrink-0 w-6 h-6 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <p className="flex-1 text-sm text-gray-200">{title}</p>
                            <button
                              onClick={() => copyToClipboard(title, `title-${idx}`)}
                              className="flex-shrink-0 p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Copy to clipboard"
                            >
                              {copiedItem === `title-${idx}` ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t('metadata.description')}</div>
                        <button
                          onClick={() => copyToClipboard(suggestions.description, 'description')}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                        >
                          {copiedItem === 'description' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-green-500">{tCommon('copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{tCommon('copy')}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{suggestions.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Re-hook Variants */}
            {loading ? (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xl font-semibold">{t('hooks.title')}</h3>
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 rounded-lg">
                    <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 animate-pulse">
                      <div className="h-4 bg-gray-800/50 rounded w-20 mb-3"></div>
                      <div className="space-y-2 mb-4">
                        <div className="h-3 bg-gray-800/30 rounded w-full"></div>
                        <div className="h-3 bg-gray-800/30 rounded w-4/5"></div>
                      </div>
                      <div className="h-10 bg-gray-800/20 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xl font-semibold">{t('hooks.title')}</h3>
                  <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded text-xs font-semibold uppercase">
                    {t('hooks.aiSuggested')}
                  </span>
                </div>

                {/* Current hook type indicator */}
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <span className="text-gray-500">{t('hooks.currentHook')}:</span>
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">
                    {analysisData?.storyboard.overview.hookCategory || 'Unknown'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(analysisData?.storyboard.replicationBlueprint.patternVariations || []).slice(0, 2).map((variant, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{t('hooks.variant', { letter: String.fromCharCode(65 + idx) })}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">{variant}</p>
                      {(() => {
                        const approvedVariant = approvedChanges.find(change => change.type === 'variant');
                        const isThisVariantApproved = approvedVariant?.variant?.index === idx;
                        const label = String.fromCharCode(65 + idx);

                        return (
                          <button
                            onClick={() => {
                              if (shouldDisableButtons) {
                                setUpgradeFeature('re-hook');
                                setShowUpgradeModal(true);
                                return;
                              }
                              approveVariant(idx, variant);
                            }}
                            disabled={shouldDisableButtons}
                            className={`w-full px-4 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${isThisVariantApproved
                              ? 'text-green-500 bg-green-500/10 border border-green-500/30 cursor-default'
                              : shouldDisableButtons
                                ? 'text-gray-500 bg-gray-800 border border-gray-700 cursor-not-allowed opacity-50'
                                : 'text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600'
                              }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {isThisVariantApproved ? t('hooks.applied', { letter: label }) : t('hooks.apply', { letter: label })}
                          </button>
                        );
                      })()}
                    </div>
                  ))}
                </div>

                {/* Try a different style section */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{t('hooks.orTryDifferent')}</span>
                    <div className="flex-1 h-px bg-gray-800"></div>
                  </div>

                  {/* Quick style presets */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {REHOOK_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          if (shouldDisableButtons) {
                            setUpgradeFeature('re-hook');
                            setShowUpgradeModal(true);
                            return;
                          }
                          handlePresetSelect(preset.id);
                        }}
                        disabled={shouldDisableButtons}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selectedPreset === preset.id
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : shouldDisableButtons
                            ? 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                          }`}
                        title={preset.description}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Collapsible hook type picker */}
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        if (shouldDisableButtons) {
                          setUpgradeFeature('re-hook');
                          setShowUpgradeModal(true);
                          return;
                        }
                        setHookTypePickerOpen(!hookTypePickerOpen);
                      }}
                      disabled={shouldDisableButtons}
                      className={`flex items-center gap-2 text-sm transition-colors ${shouldDisableButtons
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${hookTypePickerOpen ? 'rotate-180' : ''}`} />
                      <span>{t('hooks.pickType')}</span>
                      {selectedHookType && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                          {t(`hooks.types.${selectedHookType}.label`)}
                        </span>
                      )}
                    </button>

                    {hookTypePickerOpen && (
                      <div className="mt-3 grid grid-cols-2 gap-2 p-3 bg-[#1a1a1a] border border-gray-800 rounded-lg">
                        {Object.values(HOOK_TYPES).filter(type => type !== 'Other').map((hookType) => (
                          <button
                            key={hookType}
                            onClick={() => handleHookTypeSelect(hookType)}
                            className={`flex items-start gap-2 p-2 rounded-lg text-left transition-colors ${selectedHookType === hookType
                              ? 'bg-orange-500/10 border border-orange-500/30'
                              : 'hover:bg-gray-800/50'
                              }`}
                          >
                            <div className={`w-3 h-3 mt-0.5 rounded-full border-2 flex-shrink-0 ${selectedHookType === hookType
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-600'
                              }`}>
                              {selectedHookType === hookType && (
                                <div className="w-full h-full rounded-full bg-orange-500"></div>
                              )}
                            </div>
                            <div>
                              <div className={`text-xs font-medium ${selectedHookType === hookType ? 'text-orange-400' : 'text-gray-300'
                                }`}>
                                {t(`hooks.types.${hookType}.label`)}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {t(`hooks.types.${hookType}.description`)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add to approved changes button */}
                  <button
                    onClick={() => {
                      if (shouldDisableButtons) {
                        setUpgradeFeature('re-hook');
                        setShowUpgradeModal(true);
                        return;
                      }
                      addRehookRequest();
                    }}
                    disabled={shouldDisableButtons || (!selectedPreset && !selectedHookType)}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${!selectedPreset && !selectedHookType
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : shouldDisableButtons
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('hooks.addStyle')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Approved Changes */}
          <div className={`border-l border-gray-800 flex flex-col transition-all duration-100 ${approvedChangesCollapsed ? '' : 'p-6'}`}>
            {approvedChangesCollapsed ? (
              <div className="flex flex-col items-center pt-6 gap-3">
                <button
                  onClick={() => setApprovedChangesCollapsed(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Expand approved changes"
                >
                  <ChevronDown className="w-5 h-5 rotate-90" />
                </button>
                <span className="w-7 h-7 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {approvedChangesCount}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">{t('changes.title')}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {approvedChangesCount}
                    </span>
                    <button
                      onClick={() => setApprovedChangesCollapsed(true)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Collapse approved changes"
                    >
                      <ChevronUp className="w-5 h-5 -rotate-90" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {!approvedChangesCollapsed && (
              <>
                {approvedChanges.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{t('changes.noChanges')}</p>
                    <p className="text-xs text-gray-600 max-w-[240px]">
                      {t('changes.noChangesSub')}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-3">
                      {approvedChanges.map((change) => (
                        <div key={change.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              {change.type === 'fix' && change.issue && (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase text-orange-500">{t('changes.fix')}</span>
                                    <span className="text-[10px] text-gray-500">{t('whatToFix.beat', { number: change.beatNumber ?? 0 })}</span>
                                  </div>
                                  <p className="text-xs text-gray-300 mb-1">{change.issue.message}</p>
                                  <p className="text-[10px] text-gray-500 line-clamp-2">{change.issue.suggestion}</p>
                                </>
                              )}
                              {change.type === 'variant' && change.variant && (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase text-orange-500">{t('changes.rehook')}</span>
                                    <span className="text-[10px] text-gray-500">{t('changes.variant', { label: change.variant.label })}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 line-clamp-3">{change.variant.text}</p>
                                </>
                              )}
                              {change.type === 'rehook' && change.rehook && (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase text-orange-500">{t('changes.rehook')}</span>
                                    <span className="text-[10px] text-gray-500">{t('changes.generateNew')}</span>
                                  </div>
                                  <p className="text-xs text-gray-400">Style: {change.rehook.label}</p>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => removeApprovedChange(change.id)}
                              className="ml-2 p-1 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="mt-auto pt-4">
                  <div className="mb-3 text-xs text-gray-500 text-center">
                    {t('changes.estTime', { time: '~45s' })}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={approvedChanges.length === 0 || generating}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('changes.generating')}
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" fill="currentColor" />
                        {t('changes.generate')}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Upgrade Modal - Only shown for anonymous trial users */}
      {userTier === 'anonymous' && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={upgradeFeature}
          tier={userTier}
        />
      )}

      {/* Learning Indicator - Shows when saving preferences */}
      <LearningIndicator isVisible={isLearning} />

      {/* Video Picker Modal for Comparison */}
      <VideoPickerModal
        isOpen={showVideoPickerModal}
        onClose={() => setShowVideoPickerModal(false)}
        onSelect={(video) => {
          setCompareBaseVideo(video);
          setShowVideoPickerModal(false);
          setShowCompareModal(true);
        }}
        excludeJobId={jobId || undefined}
      />

      {/* Compare Modal */}
      {compareBaseVideo && analysisData && (
        <CompareModal
          isOpen={showCompareModal}
          onClose={() => {
            setShowCompareModal(false);
            setCompareBaseVideo(null);
          }}
          baseVideo={compareBaseVideo}
          currentVideo={{
            jobId: jobId || '',
            title: analysisData.storyboard.overview.title || tCommon('currentVideo'),
            videoUrl: videoUrl,
            fileUri: fileUri,
            videoId: videoUrl ? extractYouTubeId(videoUrl) : null,
            isShort: videoUrl?.includes('/shorts/') || false,
            scores: {
              overall: analysisData.lintSummary?.score || null,
              hook: analysisData.storyboard.performance?.hookStrength || null,
              structure: analysisData.storyboard.performance?.structurePacing || null,
              delivery: analysisData.storyboard.performance?.deliveryPerformance || null,
              clarity: analysisData.storyboard.performance?.content?.valueClarity || null,
            },
            stats: videoStats,
            storyboard: analysisData.storyboard,
            issues: allIssues,
            signals: analysisData.storyboard._signals,
          }}
        />
      )}
    </>
  );
}
