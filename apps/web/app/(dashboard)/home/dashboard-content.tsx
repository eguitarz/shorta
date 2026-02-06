"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Link2, Lightbulb, BarChart3, Hammer, ChevronRight, Upload, Sparkles, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoUpload } from "@/components/video-upload";
import { useTranslations } from "next-intl";

type AnalyzeMode = "url" | "upload";

interface ActivityScores {
  overall: number | null;
  hook: number | null;
  structure: number | null;
  delivery: number | null;
  clarity: number | null;
}

interface ActivityMetadata {
  format?: string;
  hookCategory?: string;
  niche?: string;
  contentType?: string;
}

interface Activity {
  id: string;
  title: string;
  type: string;
  timeAgo: string;
  status: string;
  activityType?: 'analysis' | 'generated' | 'created';
  scores?: ActivityScores;
  metadata?: ActivityMetadata;
}

interface TrendItem {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationSeconds: number | null;
  viewsPerHour: number;
  engagementRate: number;
  url: string;
}

interface TrendsResponse {
  items: TrendItem[];
  region: string;
  regionSource: string;
  usedFallback: boolean;
  generatedAt: string;
}

// Letter grade helper
function getLetterGrade(score: number | null | undefined): { label: string; color: string } {
  if (score === null || score === undefined) return { label: '-', color: 'gray' };
  if (score >= 100) return { label: 'S', color: 'purple' };
  if (score >= 80) return { label: 'A', color: 'green' };
  if (score >= 70) return { label: 'B', color: 'blue' };
  if (score >= 60) return { label: 'C', color: 'yellow' };
  if (score >= 50) return { label: 'D', color: 'orange' };
  return { label: 'F', color: 'red' };
}

// Grade badge colors
const gradeColors: Record<string, string> = {
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(value);
}

function formatViewsPerHour(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatEngagementRate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function DashboardContent() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzeMode, setAnalyzeMode] = useState<AnalyzeMode>("url");
  const [topicInput, setTopicInput] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [trendsRegion, setTrendsRegion] = useState<string | null>(null);
  const [trendsUpdatedAt, setTrendsUpdatedAt] = useState<string | null>(null);
  const [trendsPage, setTrendsPage] = useState(1);
  const [trendsChannelSet, setTrendsChannelSet] = useState<'us' | 'kr'>('us');
  const trendsPageSize = 4;
  const didLoadActivities = useRef(false);
  const didLoadTrends = useRef(false);

  const handleAnalyze = () => {
    if (!analyzeUrl.trim()) return;

    // Generate unique analysis ID
    const analysisId = crypto.randomUUID();

    // Store URL in sessionStorage
    sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify({
      url: analyzeUrl.trim(),
      status: "pending"
    }));

    // Navigate directly to analysis page
    router.push(`/analyzer/${analysisId}`);
  };

  const handleUploadComplete = (fileUri: string, fileName: string) => {
    // Generate unique analysis ID
    const analysisId = crypto.randomUUID();

    // Store fileUri in sessionStorage
    sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify({
      fileUri,
      fileName,
      status: "pending"
    }));

    // Navigate directly to analysis page
    router.push(`/analyzer/${analysisId}`);
  };

  const handleCreateStoryboard = () => {
    if (topicInput.trim()) {
      // Pass topic as query parameter
      router.push(`/storyboard/create?topic=${encodeURIComponent(topicInput.trim())}`);
    } else {
      router.push("/storyboard/create");
    }
  };

  // Fetch recent activities
  useEffect(() => {
    if (didLoadActivities.current) return;
    didLoadActivities.current = true;

    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        const response = await fetch('/api/activities/recent');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        } else {
          console.error('Failed to fetch activities');
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const loadTrends = async (channelSetOverride?: 'us' | 'kr') => {
    try {
      setTrendsLoading(true);
      setTrendsError(null);

      const params = new URLSearchParams();
      params.set('limit', '300');
      const channelSet = channelSetOverride || trendsChannelSet;
      params.set('channelSet', channelSet);

      const response = await fetch(`/api/trends/shorts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trends');
      }

      const data = (await response.json()) as TrendsResponse;
      setTrends(data.items || []);
      setTrendsRegion(data.region || null);
      setTrendsUpdatedAt(data.generatedAt || null);
      setTrendsPage(1);
    } catch (error) {
      console.error('Error fetching trends:', error);
      setTrendsError(t('trends.error'));
      setTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    if (didLoadTrends.current) return;
    didLoadTrends.current = true;
    const locale = navigator.language || '';
    if (locale.toLowerCase().startsWith('ko')) {
      setTrendsChannelSet('kr');
      loadTrends('kr');
      return;
    }
    loadTrends('us');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivityClick = (activity: Activity) => {
    if (activity.activityType === 'created') {
      // Created from scratch - navigate to storyboard generate page
      router.push(`/storyboard/generate/${activity.id}`);
    } else if (activity.activityType === 'generated') {
      // Generated from analysis - navigate to analyzer generate page
      router.push(`/analyzer/generate/${activity.id}`);
    } else {
      // Analysis job - navigate to analyzer page
      router.push(`/analyzer/${activity.id}`);
    }
  };

  const handleUseAsReference = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    // Navigate to storyboard create with this analysis as reference
    const params = new URLSearchParams({
      refId: activity.id,
      refTitle: activity.title,
      refScore: activity.scores?.overall?.toString() || '',
      refNiche: activity.metadata?.niche || '',
      refHook: activity.metadata?.hookCategory || '',
    });
    router.push(`/storyboard/create?${params.toString()}`);
  };

  return (
    <>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-400">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Create from Topic Card */}
            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
                <Hammer className="w-4 h-4" />
                <span>{t('createCard.label')}</span>
              </div>
              <h2 className="text-2xl font-semibold mb-3">
                {t('createCard.title')}
              </h2>
              <p className="text-gray-400 mb-6">
                {t('createCard.description')}
              </p>
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lightbulb className="w-5 h-5 text-gray-500" />
                  </div>
                  <Input
                    type="text"
                    placeholder={t('createCard.placeholder')}
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateStoryboard()}
                    className="w-full bg-[#0a0a0a] border-gray-800 rounded-xl h-14 pl-12 text-gray-400 placeholder:text-gray-600"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateStoryboard}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-base"
              >
                <Hammer className="w-5 h-5 mr-2" />
                {t('createCard.button')}
              </Button>
            </div>

            {/* Analyze Short Card */}
            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
                <BarChart3 className="w-4 h-4" />
                <span>{t('analyzeCard.label')}</span>
              </div>
              <h2 className="text-2xl font-semibold mb-3">
                {t('analyzeCard.title')}
              </h2>
              <p className="text-gray-400 mb-6">
                {t('analyzeCard.description')}
              </p>

              {/* Tab Toggle */}
              <div className="flex gap-1 p-1 bg-black/50 rounded-lg w-fit mb-4">
                <button
                  onClick={() => setAnalyzeMode("url")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${analyzeMode === "url"
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {t('analyzeCard.urlTab')}
                </button>
                <button
                  onClick={() => setAnalyzeMode("upload")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${analyzeMode === "upload"
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t('analyzeCard.uploadTab')}
                </button>
              </div>

              {analyzeMode === "url" ? (
                <>
                  <div className="mb-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Link2 className="w-5 h-5 text-gray-500" />
                      </div>
                      <Input
                        type="text"
                        placeholder={t('analyzeCard.placeholder')}
                        value={analyzeUrl}
                        onChange={(e) => setAnalyzeUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && analyzeUrl.trim() && handleAnalyze()}
                        className="w-full bg-[#0a0a0a] border-gray-800 rounded-xl h-14 pl-12 text-gray-400 placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!analyzeUrl.trim()}
                    className="w-full h-14 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    {t('analyzeCard.button')}
                  </Button>
                </>
              ) : (
                <VideoUpload
                  onUploadComplete={handleUploadComplete}
                />
              )}
            </div>
          </div>

          {/* Local Viral Trends */}
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 mb-12">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider">
                  <Flame className="w-4 h-4" />
                  <span>{t('trends.label')}</span>
                </div>
                <h2 className="text-2xl font-semibold mt-2">{t('trends.title')}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {t('trends.subtitle')}
                  {trendsRegion ? ` · ${trendsRegion}` : ''}
                  {trendsUpdatedAt ? ` · ${t('trends.updated')} ${new Date(trendsUpdatedAt).toLocaleTimeString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/40 rounded-full p-1 text-xs">
                  <button
                    onClick={() => { setTrendsChannelSet('us'); loadTrends('us'); }}
                    className={`px-3 py-1 rounded-full transition-colors ${trendsChannelSet === 'us'
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    US
                  </button>
                  <button
                    onClick={() => { setTrendsChannelSet('kr'); loadTrends('kr'); }}
                    className={`px-3 py-1 rounded-full transition-colors ${trendsChannelSet === 'kr'
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    KR
                  </button>
                </div>
                <button
                  onClick={() => loadTrends()}
                  className="text-sm text-orange-500 hover:text-orange-400 font-medium"
                >
                  {t('trends.refresh')}
                </button>
              </div>
            </div>

            {trendsLoading ? (
              <div className="text-center py-10 text-gray-500">
                {t('trends.loading')}
              </div>
            ) : trendsError ? (
              <div className="text-center py-10 text-gray-500">
                <p className="mb-3">{trendsError}</p>
                <button
                  onClick={() => loadTrends()}
                  className="text-sm text-orange-500 hover:text-orange-400 font-medium"
                >
                  {t('trends.retry')}
                </button>
              </div>
            ) : trends.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                {t('trends.empty')}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trends
                    .slice((trendsPage - 1) * trendsPageSize, trendsPage * trendsPageSize)
                    .map((trend) => (
                  <a
                    key={trend.videoId}
                    href={trend.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-xl border border-gray-800 bg-[#0f0f0f] hover:bg-[#151515] transition-colors p-3"
                  >
                    <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black">
                      {trend.thumbnail ? (
                        <img
                          src={trend.thumbnail}
                          alt={trend.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-600 text-xs">
                          No thumbnail
                        </div>
                      )}
                      <div className="absolute top-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black/70 text-white">
                        {formatCompactNumber(trend.viewCount)} {t('trends.views')}
                      </div>
                      <div className="absolute bottom-2 right-2 text-[11px] px-2 py-1 rounded-full bg-black/70 text-white">
                        {formatDuration(trend.durationSeconds)}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-medium text-white line-clamp-2">{trend.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                        <span>{formatViewsPerHour(trend.viewsPerHour)} {t('trends.viewsPerHour')}</span>
                        <span className="text-gray-600">•</span>
                        <span>{formatCompactNumber(trend.viewCount)} {t('trends.views')}</span>
                        <span className="text-gray-600">•</span>
                        <span>{formatEngagementRate(trend.engagementRate)} {t('trends.engagement')}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {trend.channelTitle} • {formatTimeAgo(trend.publishedAt)}
                      </p>
                    </div>
                  </a>
                  ))}
                </div>
                {trends.length > trendsPageSize && (
                  <div className="flex items-center justify-center gap-2 mt-6 text-sm">
                    {Array.from({ length: Math.ceil(trends.length / trendsPageSize) }, (_, i) => {
                      const page = i + 1;
                      const isActive = page === trendsPage;
                      return (
                        <button
                          key={page}
                          onClick={() => setTrendsPage(page)}
                          className={`h-8 w-8 rounded-full border transition-colors ${
                            isActive
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                              : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('activity.title')}
              </h3>
              <button className="text-sm text-orange-500 hover:text-orange-400 font-medium">
                {t('activity.viewAll')}
              </button>
            </div>

            <div className="space-y-1">
              {activitiesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  {t('activity.loading')}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('activity.empty')}
                </div>
              ) : (
                activities.map((activity) => {
                  const grade = activity.activityType === 'analysis' && activity.scores?.overall
                    ? getLetterGrade(activity.scores.overall)
                    : null;

                  return (
                    <div
                      key={activity.id}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 rounded-lg transition-colors group cursor-pointer"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.activityType === 'created' ? 'bg-green-500/10' :
                        activity.activityType === 'generated' ? 'bg-purple-500/10' : 'bg-orange-500/10'
                        }`}>
                        {activity.activityType === 'created' ? (
                          <Hammer className="w-5 h-5 text-green-500" />
                        ) : activity.activityType === 'generated' ? (
                          <Hammer className="w-5 h-5 text-purple-500" />
                        ) : (
                          <BarChart3 className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{activity.title}</span>
                          {grade && (
                            <span className={`px-1.5 py-0.5 text-xs font-bold rounded border ${gradeColors[grade.color]}`}>
                              {grade.label}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{activity.type} • {activity.timeAgo}</div>
                      </div>
                      {activity.activityType === 'analysis' && activity.status === 'completed' && (
                        <button
                          onClick={(e) => handleUseAsReference(e, activity)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {t('activity.useAsReference')}
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
