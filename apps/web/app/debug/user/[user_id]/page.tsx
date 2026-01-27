'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, Bug, Copy, Check, ExternalLink } from 'lucide-react';

interface UserProfile {
  user_id: string;
  tier: string;
  analyses_used: number;
  analyses_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  is_lifetime: boolean;
  preferred_language: string | null;
  created_at: string;
  updated_at: string;
}

interface AnalysisJob {
  id: string;
  status: string;
  video_url: string | null;
  file_uri: string | null;
  title: string | null;
  deterministic_score: number | null;
  hook_strength: number | null;
  structure_pacing: number | null;
  delivery_performance: number | null;
  value_clarity: number | null;
  lint_score: number | null;
  niche_category: string | null;
  content_type: string | null;
  hook_category: string | null;
  video_format: string | null;
  video_duration: number | null;
  is_public: boolean;
  starred: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface GeneratedStoryboard {
  id: string;
  analysis_job_id: string | null;
  source: 'analyzed' | 'created';
  title: string;
  niche_category: string | null;
  content_type: string | null;
  hook_pattern: string | null;
  video_length_seconds: number | null;
  changes_count: number | null;
  created_at: string;
  updated_at: string;
}

interface IssuePreference {
  issue_key: string;
  severity: string;
  original_severity: string;
  updated_at: string;
}

interface UserData {
  user_id: string;
  profile: UserProfile | null;
  profile_error: string | null;
  analysis_jobs: AnalysisJob[];
  generated_storyboards: GeneratedStoryboard[];
  issue_preferences: IssuePreference[];
}

type TabType = 'overview' | 'analyses' | 'storyboards' | 'preferences' | 'timeline';

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-500/10 text-green-400';
    case 'failed': return 'bg-red-500/10 text-red-400';
    case 'pending': return 'bg-yellow-500/10 text-yellow-400';
    default: return 'bg-blue-500/10 text-blue-400';
  }
}

function getScoreColor(score: number | null) {
  if (score == null) return 'text-gray-500';
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function relativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function DebugUserPage() {
  const params = useParams();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/debug/users/${params.user_id}`);
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to load user');
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.user_id]);

  const copyToClipboard = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-lg">Loading user data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-gray-400 mb-4">{error || 'Could not load user data'}</p>
        </div>
      </div>
    );
  }

  const { profile, analysis_jobs, generated_storyboards, issue_preferences } = data;

  // Build merged timeline
  const timeline: { type: 'analysis' | 'storyboard'; date: string; item: any }[] = [
    ...analysis_jobs.map((j) => ({ type: 'analysis' as const, date: j.created_at, item: j })),
    ...generated_storyboards.map((s) => ({ type: 'storyboard' as const, date: s.created_at, item: s })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'analyses', label: 'Analyses', count: analysis_jobs.length },
    { id: 'storyboards', label: 'Storyboards', count: generated_storyboards.length },
    { id: 'timeline', label: 'Timeline', count: timeline.length },
    { id: 'preferences', label: 'Preferences', count: issue_preferences.length },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400">Debug View - User - Development Only</span>
        </div>
      </div>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">User Debug</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded font-mono">
              {data.user_id}
            </code>
            {profile && (
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                profile.tier === 'lifetime' ? 'bg-purple-500/10 text-purple-400' :
                profile.tier === 'founder' ? 'bg-orange-500/10 text-orange-400' :
                'bg-gray-800 text-gray-400'
              }`}>
                {profile.tier}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.count != null && (
                <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Profile */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Profile</h3>
              {profile ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tier</span>
                    <span>{profile.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Analyses Used</span>
                    <span>{profile.analyses_used} / {profile.analyses_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subscription Status</span>
                    <span>{profile.subscription_status || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lifetime</span>
                    <span>{profile.is_lifetime ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Language</span>
                    <span>{profile.preferred_language || 'default'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stripe Customer</span>
                    <span className="font-mono text-xs">{profile.stripe_customer_id || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Joined</span>
                    <span className="text-xs">{formatDate(profile.created_at)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No profile found.
                  {data.profile_error && <span className="text-red-400 ml-1">({data.profile_error})</span>}
                </p>
              )}
            </div>

            {/* Activity Summary */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Analyses</span>
                  <span>{analysis_jobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-green-400">{analysis_jobs.filter(j => j.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Failed</span>
                  <span className="text-red-400">{analysis_jobs.filter(j => j.status === 'failed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Storyboards Generated</span>
                  <span>{generated_storyboards.filter(s => s.source === 'analyzed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Storyboards Created</span>
                  <span>{generated_storyboards.filter(s => s.source === 'created').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Issue Prefs Customized</span>
                  <span>{issue_preferences.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Starred Videos</span>
                  <span>{analysis_jobs.filter(j => j.starred).length}</span>
                </div>
              </div>
            </div>

            {/* Score Averages */}
            {(() => {
              const completed = analysis_jobs.filter(j => j.status === 'completed' && j.deterministic_score != null);
              if (completed.length === 0) return null;
              const avg = (key: keyof AnalysisJob) => {
                const vals = completed.map(j => j[key] as number | null).filter((v): v is number => v != null);
                if (vals.length === 0) return null;
                return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
              };
              return (
                <div className="bg-gray-900 rounded-xl p-6 col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Average Scores ({completed.length} completed)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Overall', value: avg('deterministic_score') },
                      { label: 'Hook', value: avg('hook_strength') },
                      { label: 'Structure', value: avg('structure_pacing') },
                      { label: 'Delivery', value: avg('delivery_performance') },
                      { label: 'Clarity', value: avg('value_clarity') },
                      { label: 'Lint', value: avg('lint_score') },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
                          {value ?? '—'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Recent Activity */}
            <div className="bg-gray-900 rounded-xl p-6 col-span-2">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {timeline.slice(0, 10).map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                      entry.type === 'analysis' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {entry.type === 'analysis' ? 'Analysis' : 'Storyboard'}
                    </span>
                    <span className="text-gray-300 truncate flex-1">
                      {entry.type === 'analysis'
                        ? (entry.item as AnalysisJob).title || (entry.item as AnalysisJob).video_url || entry.item.id
                        : (entry.item as GeneratedStoryboard).title}
                    </span>
                    {entry.type === 'analysis' && (
                      <span className={`text-xs ${getStatusColor((entry.item as AnalysisJob).status)} px-2 py-0.5 rounded`}>
                        {(entry.item as AnalysisJob).status}
                      </span>
                    )}
                    {entry.type === 'analysis' && (entry.item as AnalysisJob).deterministic_score != null && (
                      <span className={`text-xs font-mono ${getScoreColor((entry.item as AnalysisJob).deterministic_score)}`}>
                        {(entry.item as AnalysisJob).deterministic_score}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 shrink-0">{relativeTime(entry.date)}</span>
                    <a
                      href={entry.type === 'analysis' ? `/debug/${entry.item.id}` : `/debug/storyboard/${entry.item.id}`}
                      className="text-orange-400 hover:text-orange-300 shrink-0"
                      title="Open debug view"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <p className="text-gray-500 text-sm">No activity found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analyses' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Analysis Jobs ({analysis_jobs.length})</h3>
              <button
                onClick={() => copyToClipboard(analysis_jobs)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy JSON</span></>
                )}
              </button>
            </div>
            <div className="space-y-2 max-h-[75vh] overflow-auto">
              {analysis_jobs.map((job) => (
                <a
                  key={job.id}
                  href={`/debug/${job.id}`}
                  className="block bg-gray-900 rounded-xl p-4 hover:bg-gray-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    <span className="text-sm text-gray-200 truncate flex-1">
                      {job.title || job.video_url || job.id}
                    </span>
                    <span className="text-xs text-gray-600 shrink-0">{relativeTime(job.created_at)}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  </div>
                  {job.status === 'completed' && job.deterministic_score != null && (
                    <div className="flex gap-4 text-xs mt-1">
                      <span>Score: <span className={`font-mono font-bold ${getScoreColor(job.deterministic_score)}`}>{job.deterministic_score}</span></span>
                      <span className="text-gray-600">Hook: {job.hook_strength ?? '—'}</span>
                      <span className="text-gray-600">Structure: {job.structure_pacing ?? '—'}</span>
                      <span className="text-gray-600">Delivery: {job.delivery_performance ?? '—'}</span>
                      <span className="text-gray-600">Clarity: {job.value_clarity ?? '—'}</span>
                      <span className="text-gray-600">Lint: {job.lint_score ?? '—'}</span>
                      {job.niche_category && <span className="text-gray-600">{job.niche_category}</span>}
                      {job.video_format && <span className="text-gray-600">{job.video_format}</span>}
                    </div>
                  )}
                  {job.status === 'failed' && job.error_message && (
                    <p className="text-xs text-red-400 mt-1 truncate">{job.error_message}</p>
                  )}
                </a>
              ))}
              {analysis_jobs.length === 0 && (
                <p className="text-gray-500 text-sm">No analyses found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'storyboards' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Generated Storyboards ({generated_storyboards.length})</h3>
              <button
                onClick={() => copyToClipboard(generated_storyboards)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy JSON</span></>
                )}
              </button>
            </div>
            <div className="space-y-2 max-h-[75vh] overflow-auto">
              {generated_storyboards.map((sb) => (
                <div key={sb.id} className="bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      sb.source === 'created' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {sb.source}
                    </span>
                    <span className="text-sm text-gray-200 truncate flex-1">{sb.title}</span>
                    <span className="text-xs text-gray-600 shrink-0">{relativeTime(sb.created_at)}</span>
                    <a
                      href={`/debug/storyboard/${sb.id}`}
                      className="text-orange-400 hover:text-orange-300 shrink-0"
                      title="Open storyboard debug"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    {sb.niche_category && <span>{sb.niche_category}</span>}
                    {sb.content_type && <span>{sb.content_type}</span>}
                    {sb.hook_pattern && <span>{sb.hook_pattern}</span>}
                    {sb.video_length_seconds != null && <span>{sb.video_length_seconds}s</span>}
                    {sb.changes_count != null && sb.changes_count > 0 && <span>{sb.changes_count} changes</span>}
                    {sb.analysis_job_id && (
                      <a
                        href={`/debug/${sb.analysis_job_id}`}
                        className="text-orange-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Analysis
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {generated_storyboards.length === 0 && (
                <p className="text-gray-500 text-sm">No storyboards found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mb-2">Activity Timeline ({timeline.length})</h3>
            <div className="space-y-2 max-h-[75vh] overflow-auto">
              {timeline.map((entry, i) => {
                const isAnalysis = entry.type === 'analysis';
                const job = isAnalysis ? entry.item as AnalysisJob : null;
                const sb = !isAnalysis ? entry.item as GeneratedStoryboard : null;
                return (
                  <div key={i} className="flex items-center gap-3 bg-gray-900 rounded-lg p-3 text-sm">
                    <span className="text-xs text-gray-600 shrink-0 w-16 text-right">{relativeTime(entry.date)}</span>
                    <div className="w-px h-8 bg-gray-800 shrink-0" />
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                      isAnalysis ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {isAnalysis ? 'Analysis' : 'Storyboard'}
                    </span>
                    <span className="text-gray-300 truncate flex-1">
                      {job ? (job.title || job.video_url || job.id) : sb!.title}
                    </span>
                    {job && (
                      <span className={`text-xs ${getStatusColor(job.status)} px-2 py-0.5 rounded`}>
                        {job.status}
                      </span>
                    )}
                    {job?.deterministic_score != null && (
                      <span className={`text-xs font-mono ${getScoreColor(job.deterministic_score)}`}>
                        {job.deterministic_score}
                      </span>
                    )}
                    {sb && (
                      <span className={`text-xs ${sb.source === 'created' ? 'text-blue-400' : 'text-green-400'}`}>
                        {sb.source}
                      </span>
                    )}
                    <a
                      href={isAnalysis ? `/debug/${entry.item.id}` : `/debug/storyboard/${entry.item.id}`}
                      className="text-orange-400 hover:text-orange-300 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
              {timeline.length === 0 && (
                <p className="text-gray-500 text-sm">No activity found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Issue Preferences ({issue_preferences.length})</h3>
              <button
                onClick={() => copyToClipboard(issue_preferences)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy JSON</span></>
                )}
              </button>
            </div>
            <div className="space-y-2 max-h-[75vh] overflow-auto">
              {issue_preferences.map((pref, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-900 rounded-lg p-3 text-sm">
                  <code className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded font-mono truncate max-w-[300px]">
                    {pref.issue_key}
                  </code>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    pref.original_severity === 'critical' ? 'bg-red-500/20 text-red-400 line-through' :
                    pref.original_severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 line-through' :
                    'bg-gray-700 text-gray-400 line-through'
                  }`}>
                    {pref.original_severity}
                  </span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    pref.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    pref.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                    pref.severity === 'minor' ? 'bg-gray-700 text-gray-300' :
                    'bg-gray-800 text-gray-500'
                  }`}>
                    {pref.severity}
                  </span>
                  <span className="text-xs text-gray-600 ml-auto">{relativeTime(pref.updated_at)}</span>
                </div>
              ))}
              {issue_preferences.length === 0 && (
                <p className="text-gray-500 text-sm">No custom issue preferences.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
