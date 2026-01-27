'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, Bug, Copy, Check } from 'lucide-react';

interface StoryboardData {
  id: string;
  user_id: string;
  analysis_job_id: string | null;
  source: 'analyzed' | 'created';
  title: string;
  original_overview: any;
  original_beats: any;
  generated_overview: any;
  generated_beats: any;
  applied_changes: any;
  hook_variants: any;
  niche_category: string | null;
  content_type: string | null;
  hook_pattern: string | null;
  video_length_seconds: number | null;
  changes_count: number | null;
  created_at: string;
  updated_at: string;
}

type TabType = 'overview' | 'generated' | 'original' | 'changes' | 'hooks' | 'raw';

function BeatCard({ beat, index }: { beat: any; index: number }) {
  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded font-mono">
          {beat.startTime != null ? `${beat.startTime}s–${beat.endTime}s` : `#${beat.beatNumber ?? index + 1}`}
        </span>
        <span className="text-xs text-orange-400 font-medium">{beat.type}</span>
        <span className="font-medium text-sm">{beat.title}</span>
      </div>
      {beat.script && (
        <p className="text-sm text-gray-300 mb-2 italic">&ldquo;{beat.script}&rdquo;</p>
      )}
      {beat.transcript && !beat.script && (
        <p className="text-sm text-gray-300 mb-2 italic">&ldquo;{beat.transcript}&rdquo;</p>
      )}
      {beat.directorNotes && (
        <p className="text-xs text-yellow-400/80 mb-1">
          <span className="text-yellow-500">Director:</span> {beat.directorNotes}
        </p>
      )}
      {beat.visual && (
        <p className="text-xs text-gray-500 mb-1"><span className="text-gray-600">Visual:</span> {beat.visual}</p>
      )}
      {beat.audio && (
        <p className="text-xs text-gray-500 mb-1"><span className="text-gray-600">Audio:</span> {beat.audio}</p>
      )}
      {/* Enhanced fields for created storyboards */}
      <div className="flex flex-wrap gap-2 mt-2">
        {beat.shotType && (
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">{beat.shotType}</span>
        )}
        {beat.cameraMovement && (
          <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">{beat.cameraMovement}</span>
        )}
        {beat.transition && (
          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded">{beat.transition}</span>
        )}
      </div>
      {beat.textOverlays?.length > 0 && (
        <div className="mt-2 space-y-1">
          {beat.textOverlays.map((overlay: any, j: number) => (
            <div key={j} className="text-xs text-gray-500">
              <span className="text-gray-600">Text ({overlay.position}):</span> {overlay.text}
            </div>
          ))}
        </div>
      )}
      {beat.bRollSuggestions?.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          <span className="text-gray-600">B-Roll:</span> {beat.bRollSuggestions.join(', ')}
        </div>
      )}
      {beat.retentionTip && (
        <div className="mt-1 text-xs text-cyan-400/70">
          <span className="text-cyan-500">Retention Tip:</span> {beat.retentionTip}
        </div>
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
        </div>
      )}
    </div>
  );
}

export default function DebugStoryboardPage() {
  const params = useParams();
  const [data, setData] = useState<StoryboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/debug/storyboards/${params.id}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || 'Failed to load storyboard');
        }

        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load storyboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

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
          <span className="text-lg">Loading storyboard data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Storyboard Not Found</h2>
          <p className="text-gray-400 mb-4">{error || 'Could not load storyboard data'}</p>
          <p className="text-xs text-gray-600">
            Make sure you&apos;re running in development mode and the storyboard ID is correct.
          </p>
        </div>
      </div>
    );
  }

  const generatedBeats = data.generated_beats || [];
  const originalBeats = data.original_beats || [];
  const appliedChanges = data.applied_changes || [];
  const hookVariants = data.hook_variants || [];

  const tabs: { id: TabType; label: string; hasData: boolean }[] = [
    { id: 'overview', label: 'Overview', hasData: true },
    { id: 'generated', label: 'Generated Beats', hasData: generatedBeats.length > 0 },
    { id: 'original', label: 'Original Beats', hasData: originalBeats.length > 0 },
    { id: 'changes', label: 'Applied Changes', hasData: appliedChanges.length > 0 },
    { id: 'hooks', label: 'Hook Variants', hasData: hookVariants.length > 0 },
    { id: 'raw', label: 'Raw JSON', hasData: true },
  ];

  const getJsonForTab = () => {
    switch (activeTab) {
      case 'generated': return data.generated_beats;
      case 'original': return data.original_beats;
      case 'changes': return data.applied_changes;
      case 'hooks': return data.hook_variants;
      case 'raw': return data;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400">
            Debug View - Generated Storyboard - Development Only
          </span>
        </div>
      </div>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Storyboard Debug</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded font-mono">
              {data.id}
            </code>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              data.source === 'created' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
            }`}>
              {data.source}
            </span>
            {data.analysis_job_id && (
              <a
                href={`/debug/${data.analysis_job_id}`}
                className="text-xs text-orange-400 hover:underline"
              >
                View Analysis Job
              </a>
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
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-2 gap-6">
            {/* Storyboard Info */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Storyboard Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Title</span>
                  <span className="text-right max-w-[60%]">{data.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Source</span>
                  <span>{data.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID</span>
                  <span className="font-mono text-xs">{data.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Analysis Job</span>
                  <span className="font-mono text-xs">{data.analysis_job_id || 'null'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Changes Count</span>
                  <span>{data.changes_count ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Metadata</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Niche</span>
                  <span>{data.niche_category || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Content Type</span>
                  <span>{data.content_type || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hook Pattern</span>
                  <span>{data.hook_pattern || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Video Length</span>
                  <span>{data.video_length_seconds ? `${data.video_length_seconds}s` : '—'}</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Timestamps</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="font-mono text-xs">{data.created_at}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated</span>
                  <span className="font-mono text-xs">{data.updated_at}</span>
                </div>
              </div>
            </div>

            {/* Generated Overview */}
            {data.generated_overview && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Generated Overview</h3>
                <div className="space-y-3 text-sm">
                  {Object.entries(data.generated_overview).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400">{key}</span>
                      <span className="text-right max-w-[60%] text-gray-200">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Summary */}
            <div className="bg-gray-900 rounded-xl p-6 col-span-2">
              <h3 className="text-lg font-semibold mb-4">Data Availability</h3>
              <div className="flex gap-4 flex-wrap">
                <div className={`px-4 py-2 rounded-lg ${generatedBeats.length > 0 ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  Generated Beats: {generatedBeats.length}
                </div>
                <div className={`px-4 py-2 rounded-lg ${originalBeats.length > 0 ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  Original Beats: {originalBeats.length}
                </div>
                <div className={`px-4 py-2 rounded-lg ${appliedChanges.length > 0 ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  Applied Changes: {appliedChanges.length}
                </div>
                <div className={`px-4 py-2 rounded-lg ${hookVariants.length > 0 ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  Hook Variants: {hookVariants.length}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'generated' ? (
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Beats ({generatedBeats.length})</h3>
              <button
                onClick={() => copyToClipboard(data.generated_beats)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy JSON</span></>
                )}
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-auto">
              {generatedBeats.map((beat: any, i: number) => (
                <BeatCard key={i} beat={beat} index={i} />
              ))}
            </div>
          </div>
        ) : activeTab === 'original' ? (
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Original Beats ({originalBeats.length})</h3>
              <button
                onClick={() => copyToClipboard(data.original_beats)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy JSON</span></>
                )}
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-auto">
              {originalBeats.map((beat: any, i: number) => (
                <BeatCard key={i} beat={beat} index={i} />
              ))}
            </div>
          </div>
        ) : activeTab === 'changes' ? (
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Applied Changes ({appliedChanges.length})</h3>
              <button
                onClick={() => copyToClipboard(data.applied_changes)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy JSON</span></>
                )}
              </button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-auto">
              {appliedChanges.map((change: any, i: number) => (
                <div key={i} className="border border-gray-800 rounded-lg p-4 text-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      change.type === 'fix' ? 'bg-green-500/20 text-green-400' :
                      change.type === 'variant' ? 'bg-blue-500/20 text-blue-400' :
                      change.type === 'rehook' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {change.type}
                    </span>
                    {change.beatNumber != null && (
                      <span className="text-xs text-gray-500">Beat {change.beatNumber}</span>
                    )}
                    {change.beatTitle && (
                      <span className="text-gray-400">{change.beatTitle}</span>
                    )}
                  </div>
                  {change.issue && (
                    <div className="text-gray-300 mb-1">
                      <span className={`text-xs ${
                        change.issue.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                      }`}>[{change.issue.severity}]</span>{' '}
                      {change.issue.message}
                      {change.issue.suggestion && (
                        <div className="text-gray-500 text-xs mt-0.5">{change.issue.suggestion}</div>
                      )}
                    </div>
                  )}
                  {change.variant && (
                    <div className="text-gray-300">
                      <span className="text-gray-500">{change.variant.label}:</span> {change.variant.text}
                    </div>
                  )}
                  {change.rehook && (
                    <div className="text-gray-300">
                      <span className="text-gray-500">Rehook:</span> {change.rehook.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'hooks' ? (
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Hook Variants ({hookVariants.length})</h3>
              <button
                onClick={() => copyToClipboard(data.hook_variants)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy JSON</span></>
                )}
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-auto">
              {hookVariants.map((hook: any, i: number) => (
                <div key={i} className="border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-orange-400">{hook.label || hook.style || `Variant ${i + 1}`}</span>
                    {hook.id && (
                      <span className="text-xs bg-gray-800 px-2 py-0.5 rounded font-mono text-gray-500">{hook.id}</span>
                    )}
                  </div>
                  {hook.script && (
                    <p className="text-sm text-gray-300 mb-2 italic">&ldquo;{hook.script}&rdquo;</p>
                  )}
                  {hook.directorNotes && (
                    <p className="text-xs text-yellow-400/80 mb-1">
                      <span className="text-yellow-500">Director:</span> {hook.directorNotes}
                    </p>
                  )}
                  {hook.visual && (
                    <p className="text-xs text-gray-500 mb-1"><span className="text-gray-600">Visual:</span> {hook.visual}</p>
                  )}
                  {hook.audio && (
                    <p className="text-xs text-gray-500 mb-1"><span className="text-gray-600">Audio:</span> {hook.audio}</p>
                  )}
                  {hook.whyItWorks && (
                    <p className="text-xs text-cyan-400/70 mt-2">
                      <span className="text-cyan-500">Why it works:</span> {hook.whyItWorks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Raw JSON */
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Raw Data</h3>
              <button
                onClick={() => copyToClipboard(data)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy JSON</span></>
                )}
              </button>
            </div>
            <pre className="text-sm text-gray-300 bg-gray-800 p-4 rounded-lg overflow-auto max-h-[70vh] font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
