'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, Bug, Copy, Check } from 'lucide-react';

interface JobData {
  job_id: string;
  status: string;
  current_step: number;
  total_steps: number;
  video_url: string | null;
  file_uri: string | null;
  is_anonymous: boolean;
  is_public: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
  classification_result: any;
  lint_result: any;
  storyboard_result: any;
}

type TabType = 'overview' | 'report' | 'classification' | 'lint' | 'storyboard' | 'raw';

function getLetterGrade(score: number): { letter: string; color: string } {
  if (score >= 100) return { letter: 'S', color: 'text-purple-400' };
  if (score >= 90) return { letter: 'A', color: 'text-green-400' };
  if (score >= 80) return { letter: 'B', color: 'text-blue-400' };
  if (score >= 70) return { letter: 'C', color: 'text-yellow-400' };
  if (score >= 60) return { letter: 'D', color: 'text-orange-400' };
  return { letter: 'F', color: 'text-red-400' };
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ReportView({ job }: { job: JobData }) {
  const storyboard = job.storyboard_result;
  const lint = job.lint_result;
  if (!storyboard) return null;

  const perf = storyboard.performance;
  const overview = storyboard.overview;
  const grade = getLetterGrade(perf?.score ?? 0);
  const beats = storyboard.beats || [];
  const issues = lint?.issues || [];
  const scoreBreakdown = perf?._scoreBreakdown;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className={`text-6xl font-black ${grade.color}`}>{grade.letter}</div>
          <div className="flex-1">
            <div className="text-2xl font-bold mb-1">
              Score: {perf?.score ?? '—'}
            </div>
            {perf?.directorAssessment && (
              <p className="text-sm text-gray-400 line-clamp-3">{perf.directorAssessment}</p>
            )}
          </div>
        </div>
      </div>

      {/* Overview Metadata */}
      {overview && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Video Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {overview.title && (
              <div className="col-span-2">
                <span className="text-gray-400">Title:</span>{' '}
                <span className="text-gray-200">{overview.title}</span>
              </div>
            )}
            {overview.hookCategory && (
              <div>
                <span className="text-gray-400">Hook:</span>{' '}
                <span className="text-gray-200">{overview.hookCategory}{overview.hookPattern ? ` — ${overview.hookPattern}` : ''}</span>
              </div>
            )}
            {overview.nicheCategory && (
              <div>
                <span className="text-gray-400">Niche:</span>{' '}
                <span className="text-gray-200">{overview.nicheCategory}</span>
              </div>
            )}
            {overview.contentType && (
              <div>
                <span className="text-gray-400">Content Type:</span>{' '}
                <span className="text-gray-200">{overview.contentType}</span>
              </div>
            )}
            {overview.targetAudience && (
              <div>
                <span className="text-gray-400">Target Audience:</span>{' '}
                <span className="text-gray-200">{overview.targetAudience}</span>
              </div>
            )}
            {overview.length != null && (
              <div>
                <span className="text-gray-400">Length:</span>{' '}
                <span className="text-gray-200">{overview.length}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {perf && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3 text-orange-400">Hook</h4>
            <div className="text-2xl font-bold mb-2">{perf.hookStrength ?? '—'}</div>
            {perf.hook?.analysis && <p className="text-xs text-gray-400 mb-3">{perf.hook.analysis}</p>}
            <div className="space-y-2">
              {scoreBreakdown?.hook && Object.entries(scoreBreakdown.hook).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={v as number} max={25} />
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3 text-blue-400">Structure</h4>
            <div className="text-2xl font-bold mb-2">{perf.structurePacing ?? '—'}</div>
            {perf.structure?.analysis && <p className="text-xs text-gray-400 mb-3">{perf.structure.analysis}</p>}
            <div className="space-y-2">
              {scoreBreakdown?.structure && Object.entries(scoreBreakdown.structure).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={v as number} max={25} />
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3 text-green-400">Clarity</h4>
            <div className="text-2xl font-bold mb-2">{perf.content?.valueClarity ?? '—'}</div>
            {perf.content?.analysis && <p className="text-xs text-gray-400 mb-3">{perf.content.analysis}</p>}
            <div className="space-y-2">
              {scoreBreakdown?.clarity && Object.entries(scoreBreakdown.clarity).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={v as number} max={25} />
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3 text-purple-400">Delivery</h4>
            <div className="text-2xl font-bold mb-2">{perf.deliveryPerformance ?? '—'}</div>
            {perf.delivery?.analysis && <p className="text-xs text-gray-400 mb-3">{perf.delivery.analysis}</p>}
            <div className="space-y-2">
              {scoreBreakdown?.delivery && Object.entries(scoreBreakdown.delivery).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={v as number} max={25} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lint Issues */}
      {issues.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            Issues ({issues.length})
            {lint && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                Lint Score: {lint.score} | Passed: {lint.passed} | Moderate: {lint.moderate} | Critical: {lint.critical}
              </span>
            )}
          </h3>
          <div className="space-y-2 max-h-[50vh] overflow-auto">
            {issues.map((issue: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm border-b border-gray-800 pb-2">
                <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                  issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  issue.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {issue.severity}
                </span>
                <div>
                  <div className="text-gray-200">{issue.message}</div>
                  {issue.suggestion && (
                    <div className="text-gray-500 text-xs mt-0.5">{issue.suggestion}</div>
                  )}
                  {issue.beatNumber != null && (
                    <span className="text-xs text-gray-600">Beat {issue.beatNumber}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Beat Breakdown */}
      {beats.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Beats ({beats.length})</h3>
          <div className="space-y-4 max-h-[60vh] overflow-auto">
            {beats.map((beat: any, i: number) => (
              <div key={i} className="border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded font-mono">
                    {beat.startTime != null ? `${beat.startTime}s–${beat.endTime}s` : `#${beat.beatNumber}`}
                  </span>
                  <span className="text-xs text-orange-400 font-medium">{beat.type}</span>
                  <span className="font-medium text-sm">{beat.title}</span>
                </div>
                {beat.transcript && (
                  <p className="text-sm text-gray-300 mb-2 italic">"{beat.transcript}"</p>
                )}
                {beat.visual && (
                  <p className="text-xs text-gray-500 mb-1"><span className="text-gray-600">Visual:</span> {beat.visual}</p>
                )}
                {beat.audio && (
                  <p className="text-xs text-gray-500 mb-1"><span className="text-gray-600">Audio:</span> {beat.audio}</p>
                )}
                {beat.retention && (
                  <div className="mt-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${
                      beat.retention.level === 'high' ? 'bg-green-500/20 text-green-400' :
                      beat.retention.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {beat.retention.level} retention
                    </span>
                    {beat.retention.analysis && (
                      <p className="text-gray-500 mt-1">{beat.retention.analysis}</p>
                    )}
                    {beat.retention.issues?.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {beat.retention.issues.map((issue: any, j: number) => (
                          <div key={j} className="text-gray-400">
                            <span className={
                              issue.severity === 'critical' ? 'text-red-400' :
                              issue.severity === 'moderate' ? 'text-yellow-400' : 'text-gray-500'
                            }>
                              [{issue.severity}]
                            </span>{' '}
                            {issue.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DebugJobPage() {
  const params = useParams();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/debug/jobs/${params.job_id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load job');
        }

        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.job_id]);

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-500/10';
      case 'failed':
        return 'text-red-500 bg-red-500/10';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-blue-500 bg-blue-500/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-lg">Loading job data...</span>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
          <p className="text-gray-400 mb-4">{error || 'Could not load job data'}</p>
          <p className="text-xs text-gray-600">
            Make sure you're running in development mode and the job ID is correct.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; hasData: boolean }[] = [
    { id: 'overview', label: 'Overview', hasData: true },
    { id: 'report', label: 'Report', hasData: !!job.storyboard_result },
    { id: 'classification', label: 'Classification', hasData: !!job.classification_result },
    { id: 'lint', label: 'Lint Result', hasData: !!job.lint_result },
    { id: 'storyboard', label: 'Storyboard', hasData: !!job.storyboard_result },
    { id: 'raw', label: 'Raw JSON', hasData: true },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'classification':
        return job.classification_result;
      case 'lint':
        return job.lint_result;
      case 'storyboard':
        return job.storyboard_result;
      case 'raw':
        return job;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400">
            Debug View - Development Only
          </span>
        </div>
      </div>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Job ID Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Job Debug</h1>
          <div className="flex items-center gap-3">
            <code className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded font-mono">
              {job.job_id}
            </code>
            <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
            <span className="text-sm text-gray-500">
              Step {job.current_step}/{job.total_steps}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : tab.hasData
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              }`}
              disabled={!tab.hasData}
            >
              {tab.label}
              {!tab.hasData && tab.id !== 'overview' && tab.id !== 'raw' && (
                <span className="ml-2 text-xs opacity-50">(empty)</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'report' ? (
          <ReportView job={job} />
        ) : activeTab === 'overview' ? (
          <div className="grid grid-cols-2 gap-6">
            {/* Job Info */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Job Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-medium ${getStatusColor(job.status).split(' ')[0]}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress</span>
                  <span>{job.current_step}/{job.total_steps} steps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Anonymous</span>
                  <span>{job.is_anonymous ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Public</span>
                  <span>{job.is_public ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID</span>
                  <span className="font-mono text-xs">{job.user_id || 'null'}</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Timestamps</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="font-mono text-xs">{job.created_at}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated</span>
                  <span className="font-mono text-xs">{job.updated_at}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completed</span>
                  <span className="font-mono text-xs">{job.completed_at || 'null'}</span>
                </div>
              </div>
            </div>

            {/* Video Source */}
            <div className="bg-gray-900 rounded-xl p-6 col-span-2">
              <h3 className="text-lg font-semibold mb-4">Video Source</h3>
              <div className="space-y-3 text-sm">
                {job.video_url && (
                  <div>
                    <span className="text-gray-400 block mb-1">Video URL</span>
                    <a
                      href={job.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline break-all"
                    >
                      {job.video_url}
                    </a>
                  </div>
                )}
                {job.file_uri && (
                  <div>
                    <span className="text-gray-400 block mb-1">File URI (Gemini)</span>
                    <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded break-all block">
                      {job.file_uri}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {job.error_message && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 col-span-2">
                <h3 className="text-lg font-semibold mb-2 text-red-400">Error</h3>
                <pre className="text-sm text-red-300 whitespace-pre-wrap">
                  {job.error_message}
                </pre>
              </div>
            )}

            {/* Data Availability */}
            <div className="bg-gray-900 rounded-xl p-6 col-span-2">
              <h3 className="text-lg font-semibold mb-4">Data Availability</h3>
              <div className="flex gap-4">
                <div className={`px-4 py-2 rounded-lg ${job.classification_result ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  Classification {job.classification_result ? '✓' : '✗'}
                </div>
                <div className={`px-4 py-2 rounded-lg ${job.lint_result ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  Lint Result {job.lint_result ? '✓' : '✗'}
                </div>
                <div className={`px-4 py-2 rounded-lg ${job.storyboard_result ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  Storyboard {job.storyboard_result ? '✓' : '✗'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {activeTab === 'classification' && 'Classification Result'}
                {activeTab === 'lint' && 'Lint Result'}
                {activeTab === 'storyboard' && 'Storyboard Result'}
                {activeTab === 'raw' && 'Raw Job Data'}
              </h3>
              <button
                onClick={() => copyToClipboard(getCurrentData())}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-sm text-gray-300 bg-gray-800 p-4 rounded-lg overflow-auto max-h-[70vh] font-mono">
              {JSON.stringify(getCurrentData(), null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
