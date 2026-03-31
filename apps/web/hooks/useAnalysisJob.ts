"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

interface AnalysisData {
  url: string;
  classification: any;
  lintSummary: any;
  storyboard: any;
  analyzedAt: string;
  [key: string]: any;
}

type JobStatus = 'pending' | 'classifying' | 'linting' | 'storyboarding' | 'completed' | 'failed';

interface UseAnalysisJobReturn {
  /** The video URL (YouTube) */
  videoUrl: string | null;
  /** The file URI (for uploaded videos) */
  fileUri: string | null;
  /** The uploaded file name */
  fileName: string | null;
  /** The complete analysis data (null until analysis finishes) */
  analysisData: AnalysisData | null;
  /** Whether the initial load is in progress */
  loading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** The analysis job ID */
  jobId: string | null;
  /** Current job status */
  jobStatus: JobStatus;
  /** Current step number (0-based) */
  currentStep: number;
  /** Progress percentage (0-100) */
  progressPercent: number;
  /** User tier from the job response */
  userTier: 'anonymous' | 'free' | 'founder' | 'lifetime';
  /** Remaining analyses for the user */
  analysesRemaining: number;
  /** Whether this is a trial/anonymous session */
  isTrialMode: boolean;
}

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
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
}

/**
 * Hook that manages the analysis job lifecycle:
 * - Loads video URL from sessionStorage or fetches job from API
 * - Creates analysis jobs for new URLs
 * - Polls job status every 5 seconds until completed/failed
 * - Returns all state needed to render the results page
 */
export function useAnalysisJob(): UseAnalysisJobReturn {
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

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>('pending');
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const [userTier, setUserTier] = useState<'anonymous' | 'free' | 'founder' | 'lifetime'>(
    isTrialMode ? 'anonymous' : 'free'
  );
  const [analysesRemaining, setAnalysesRemaining] = useState<number>(3);

  // Load URL or fileUri from sessionStorage or API
  useEffect(() => {
    const id = params.id as string;
    const stored = sessionStorage.getItem(`analysis_${id}`);

    if (isTrialMode) {
      return;
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const url = parsed.url;
        const storedFileUri = parsed.fileUri;
        const storedFileName = parsed.fileName;

        if (!url && !storedFileUri) {
          router.push("/analyzer/create");
          return;
        }

        if (url) setVideoUrl(url);
        if (storedFileUri) {
          setFileUri(storedFileUri);
          setFileName(storedFileName || 'Uploaded video');
        }

        if (parsed.status === "complete" && parsed.storyboard) {
          setAnalysisData(parsed);
          setLoading(false);
        }

        if (parsed.job_id) {
          setJobId(parsed.job_id);
        }
      } catch (err) {
        console.error("Error loading from sessionStorage:", err);
        router.push("/analyzer/create");
      }
      return;
    }

    // Check if ID is a job UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      setJobId(id);

      const fetchJob = async () => {
        try {
          const response = await fetch(`/api/jobs/analysis/${id}?locale=${locale}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch job');
          }

          setJobStatus(data.status);
          setCurrentStep(data.current_step);
          setProgressPercent(data.progress_percent);

          if (data.video_url) setVideoUrl(data.video_url);
          if (data.file_uri) setFileUri(data.file_uri);

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

    router.push("/analyzer/create");
  }, [params.id, router, isTrialMode]);

  // Trial mode: set job_id from URL params
  useEffect(() => {
    if (isTrialMode && !jobId) {
      const id = params.id as string;
      setJobId(id);
    }
  }, [isTrialMode, jobId, params.id]);

  // Create analysis job if needed
  useEffect(() => {
    if (isTrialMode) return;
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

        const id = params.id as string;
        sessionStorage.setItem(`analysis_${id}`, JSON.stringify({
          job_id: data.job_id,
          ...(videoUrl ? { url: videoUrl } : { fileUri, fileName }),
          status: 'pending',
        }));
      } catch (err) {
        console.error('Job creation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to create job');
        setLoading(false);
      }
    };

    createJob();
  }, [videoUrl, fileUri, fileName, analysisData, jobId, params.id, isTrialMode]);

  // Poll job status every 5 seconds
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

        if (data.tier) setUserTier(data.tier);
        if (data.analyses_remaining !== undefined) setAnalysesRemaining(data.analyses_remaining);

        if (isTrialMode && data.video_url && !videoUrl) setVideoUrl(data.video_url);
        if (isTrialMode && data.file_uri && !fileUri) setFileUri(data.file_uri);

        if (data.status === 'completed') {
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
        }

        if (data.status === 'failed') {
          setError(data.error_message || 'Analysis failed');
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError(err instanceof Error ? err.message : 'Polling failed');
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus, params.id]);

  return {
    videoUrl,
    fileUri,
    fileName,
    analysisData,
    loading,
    error,
    jobId,
    jobStatus,
    currentStep,
    progressPercent,
    userTier,
    analysesRemaining,
    isTrialMode,
  };
}
