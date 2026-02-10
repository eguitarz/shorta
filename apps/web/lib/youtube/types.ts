// YouTube Connect TypeScript types

/** YouTube connection status */
export type YouTubeConnectionStatus = 'active' | 'needs_reauth' | 'disconnected';

/** Stored YouTube connection record */
export interface YouTubeConnection {
  id: string;
  user_id: string;
  channel_id: string;
  channel_title: string | null;
  channel_thumbnail_url: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  status: YouTubeConnectionStatus;
  last_video_sync_at: string | null;
  connected_at: string;
  updated_at: string;
}

/** Public connection info returned to client (no tokens) */
export interface YouTubeConnectionInfo {
  connected: boolean;
  channelId: string | null;
  channelTitle: string | null;
  channelThumbnail: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  status: YouTubeConnectionStatus | null;
  lastVideoSync: string | null;
}

/** OAuth token response from Google */
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/** YouTube channel info from API */
export interface YouTubeChannelInfo {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
}

/** YouTube video item from search/list API */
export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds: number;
  isShort: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  privacyStatus: 'public' | 'unlisted' | 'private';
}

/** Channel video record stored in DB */
export interface ChannelVideo {
  id: string;
  user_id: string;
  youtube_video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  duration_seconds: number | null;
  is_short: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  privacy_status: 'public' | 'unlisted' | 'private';
  analysis_job_id: string | null;
  avg_view_duration_seconds: number | null;
  avg_view_percentage: number | null;
  synced_at: string;
  updated_at: string;
}

/** Monetization analysis result from Gemini */
export interface MonetizationAnalysis {
  marketSize: 'small' | 'medium' | 'large' | 'massive';
  marketSizeReasoning: string;
  estimatedCpmRange: { low: number; high: number };
  monthlyRevenueEstimate: { low: number; high: number };
  competitionLevel: 'low' | 'medium' | 'high' | 'saturated';
  competitionReasoning: string;
  growthPotential: 'declining' | 'stable' | 'growing' | 'explosive';
  growthPotentialReasoning: string;
  overallConfidence: number;
  confidenceReasoning: string;
  monetizationStrategies: string[];
  recommendation: string;
  nicheAdvice: string;
}

/** Channel profile with niche detection results */
export interface ChannelProfile {
  id: string;
  user_id: string;
  primary_niche: string | null;
  secondary_niches: string[];
  niche_confidence: number | null;
  niche_reasoning: string | null;
  primary_format: string | null;
  target_audience: string | null;
  content_themes: string[];
  avg_view_count: number | null;
  avg_engagement_rate: number | null;
  total_videos_analyzed: number;
  avg_shorta_score: number | null;
  monetization_analysis: MonetizationAnalysis | null;
  analyzed_at: string;
  updated_at: string;
}

/** Niche detection result from Gemini */
export interface NicheDetectionResult {
  primaryNiche: string;
  secondaryNiches: string[];
  nicheConfidence: number;
  reasoning: string;
  targetAudience: string;
  contentThemes: string[];
  primaryFormat: string;
}

/** Video sync result summary */
export interface VideoSyncResult {
  synced: number;
  shorts: number;
  linked: number;
}

/** ISO 8601 duration parser result */
export interface ParsedDuration {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/** Channel stats snapshot record */
export interface ChannelStatsSnapshot {
  id: string;
  user_id: string;
  subscriber_count: number;
  video_count: number;
  total_views: number;
  total_shorts_count: number;
  avg_short_views: number | null;
  avg_short_likes: number | null;
  avg_short_comments: number | null;
  snapshot_date: string;
  created_at: string;
}

/** Summary of a channel video for display */
export interface ChannelVideoSummary {
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  analysis_job_id: string | null;
  privacy_status: string;
  avg_view_duration_seconds: number | null;
  avg_view_percentage: number | null;
}

/** Retention metrics summary for the channel */
export interface RetentionMetrics {
  avgCompletionRate: number | null;
  totalShortsWithData: number;
  topRetention: ChannelVideoSummary[];
  lowestRetention: ChannelVideoSummary[];
}

/** A single metric change (current vs previous) */
export interface MetricChange {
  current: number;
  previous: number | null;
  delta: number | null;
  percentChange: number | null;
}

/** Week-over-week changes for key metrics */
export interface WeekOverWeekChanges {
  subscribers: MetricChange;
  totalViews: MetricChange;
  avgShortViews: MetricChange;
  engagementRate: MetricChange;
}

/** A single point on the retention curve */
export interface RetentionCurvePoint {
  ratio: number;              // 0.00-1.00 (position in video)
  watchRatio: number;         // fraction still watching (0.0-1.0)
  relativePerformance: number; // vs similar-length videos (1.0 = average)
}

/** Per-video retention curve data */
export interface VideoRetentionCurve {
  youtubeVideoId: string;
  curveData: RetentionCurvePoint[];
  fetchedAt: string;
  isFresh: boolean;           // true if fetched_at < 24h ago
}

/** Combined channel analytics response */
export interface ChannelAnalytics {
  profile: ChannelProfile | null;
  connection: YouTubeConnectionInfo | null;
  stats: {
    totalVideos: number;
    shortsCount: number;
    analyzedCount: number;
  };
  weekOverWeekChanges: WeekOverWeekChanges | null;
  historicalSnapshots: ChannelStatsSnapshot[];
  topShorts: ChannelVideoSummary[];
  unanalyzedShorts: ChannelVideoSummary[];
  retentionMetrics: RetentionMetrics | null;
}
