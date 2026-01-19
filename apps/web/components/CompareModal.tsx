'use client';

import { X, Eye, Heart, Clock, Upload, ChevronDown, ChevronUp, CheckCircle2, Plus, Minus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { UserVideo } from './VideoPickerModal';

interface CompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseVideo: UserVideo;
    currentVideo: {
        jobId: string;
        title: string;
        videoUrl: string | null;
        fileUri: string | null;
        videoId: string | null;
        isShort: boolean;
        scores: {
            overall: number | null;
            hook: number | null;
            structure: number | null;
            delivery: number | null;
            clarity: number | null;
        };
        stats: {
            views: number;
            likes: number;
            publishedAt: string;
        } | null;
        storyboard: any;
        issues: any[];
        signals?: any;
    };
}

// Get letter grade from score
const getLetterGrade = (score: number | null): { label: string; color: string } => {
    if (score === null) return { label: '?', color: 'gray' };
    if (score >= 100) return { label: 'S', color: 'purple' };
    if (score >= 80) return { label: 'A', color: 'green' };
    if (score >= 70) return { label: 'B', color: 'blue' };
    if (score >= 60) return { label: 'C', color: 'yellow' };
    if (score >= 50) return { label: 'D', color: 'orange' };
    return { label: 'F', color: 'red' };
};

// Format number with compact notation
const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '—';
    return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num);
};

// Format relative time
const formatRelativeTime = (dateString: string | null | undefined, tTime: any, tCompare: any): string => {
    if (!dateString) return '—';
    const now = new Date();
    const date = new Date(dateString);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays < 1) return tCompare('today');
    if (diffDays === 1) return tCompare('yesterday');
    if (diffDays < 7) return tTime('days', { count: diffDays });
    if (diffDays < 30) return tTime('weeks', { count: Math.floor(diffDays / 7) });
    if (diffDays < 365) return tTime('months', { count: Math.floor(diffDays / 30) });
    return tTime('years', { count: Math.floor(diffDays / 365) });
};

// Calculate delta and return display values
interface DeltaResult {
    text: string;
    color: string;
    hasChange: boolean;
}

const calculateDelta = (
    current: number | null | undefined,
    base: number | null | undefined,
    invertBetter: boolean = false
): DeltaResult => {
    if (current === null || current === undefined || base === null || base === undefined) {
        return { text: '', color: 'gray', hasChange: false };
    }

    const delta = current - base;
    if (delta === 0) {
        return { text: '(=)', color: 'gray', hasChange: false };
    }

    const isBetter = invertBetter ? delta < 0 : delta > 0;
    const sign = delta > 0 ? '+' : '';

    return {
        text: `(${sign}${Math.round(delta)})`,
        color: isBetter ? 'green' : 'red',
        hasChange: true,
    };
};

// Metric comparison row component
interface MetricRowProps {
    label: string;
    baseValue: string | number | null;
    currentValue: string | number | null;
    delta?: DeltaResult;
    tooltip?: string;
}

const MetricRow = ({ label, baseValue, currentValue, delta, tooltip }: MetricRowProps) => (
    <div className="flex items-center py-2 border-b border-gray-800/50 last:border-0 text-sm">
        <div className="flex-1 text-right pr-4 text-gray-400">
            {baseValue ?? '—'}
        </div>
        <div className="flex-shrink-0 w-32 text-center text-gray-500 text-xs relative group">
            {label}
            {tooltip && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                    {tooltip}
                </span>
            )}
        </div>
        <div className="flex-1 pl-4 text-white flex items-center gap-2">
            <span>{currentValue ?? '—'}</span>
            {delta?.hasChange && (
                <span className={`text-xs text-${delta.color}-500`}>
                    {delta.text}
                </span>
            )}
        </div>
    </div>
);

// Section header component
interface SectionHeaderProps {
    title: string;
    baseGrade?: { label: string; color: string };
    currentGrade?: { label: string; color: string };
    expanded: boolean;
    onToggle: () => void;
}

const SectionHeader = ({ title, baseGrade, currentGrade, expanded, onToggle }: SectionHeaderProps) => (
    <button
        onClick={onToggle}
        className="w-full flex items-center py-3 px-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors"
    >
        <div className="flex-1 flex items-center justify-end gap-2">
            {baseGrade && (
                <span className={`text-lg font-bold text-${baseGrade.color}-500`}>
                    {baseGrade.label}
                </span>
            )}
        </div>
        <div className="flex-shrink-0 w-32 text-center font-medium text-white flex items-center justify-center gap-2">
            {title}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        <div className="flex-1 flex items-center gap-2">
            {currentGrade && (
                <>
                    <span className={`text-lg font-bold text-${currentGrade.color}-500`}>
                        {currentGrade.label}
                    </span>
                    {baseGrade && currentGrade.label !== baseGrade.label && (
                        <span className={`text-xs ${['S', 'A'].includes(currentGrade.label) && !['S', 'A'].includes(baseGrade.label)
                            ? 'text-green-500'
                            : ['F', 'D'].includes(currentGrade.label) && !['F', 'D'].includes(baseGrade.label)
                                ? 'text-red-500'
                                : 'text-gray-500'
                            }`}>
                            {['S', 'A', 'B', 'C', 'D', 'F'].indexOf(currentGrade.label) < ['S', 'A', 'B', 'C', 'D', 'F'].indexOf(baseGrade.label) ? '↑' : '↓'}
                        </span>
                    )}
                </>
            )}
        </div>
    </button>
);

// Issue status types
type IssueStatus = 'fixed' | 'new' | 'unchanged';

interface IssueWithStatus {
    message: string;
    severity: string;
    suggestion?: string;
    status: IssueStatus;
    beatNumbers?: number[];
}

export function CompareModal({ isOpen, onClose, baseVideo, currentVideo }: CompareModalProps) {
    const tCompare = useTranslations('comparison');
    const tAnalyzer = useTranslations('analyzer');
    const tCommon = useTranslations('common');
    const tTime = useTranslations('time');

    const [hookExpanded, setHookExpanded] = useState(true);
    const [structureExpanded, setStructureExpanded] = useState(true);
    const [clarityExpanded, setClarityExpanded] = useState(true);
    const [deliveryExpanded, setDeliveryExpanded] = useState(true);
    const [issuesExpanded, setIssuesExpanded] = useState(true);

    // Base video stats
    const [baseVideoStats, setBaseVideoStats] = useState<{ views: number; likes: number; publishedAt: string } | null>(null);
    const [baseStatsLoading, setBaseStatsLoading] = useState(false);

    // Fetch YouTube stats for base video
    useEffect(() => {
        if (!isOpen || !baseVideo.videoUrl) {
            setBaseVideoStats(null);
            return;
        }

        const fetchStats = async () => {
            setBaseStatsLoading(true);
            try {
                const response = await fetch(`/api/youtube-stats?url=${encodeURIComponent(baseVideo.videoUrl!)}`);
                if (response.ok) {
                    const stats = await response.json();
                    setBaseVideoStats(stats);
                } else {
                    setBaseVideoStats(null);
                }
            } catch (error) {
                console.error('Error fetching base video stats:', error);
                setBaseVideoStats(null);
            } finally {
                setBaseStatsLoading(false);
            }
        };

        fetchStats();
    }, [isOpen, baseVideo.videoUrl]);

    if (!isOpen) return null;

    // Extract signals from storyboard
    const baseSignals = baseVideo.storyboard?._signals;
    const currentSignals = currentVideo.signals || currentVideo.storyboard?._signals;

    // Calculate issue comparison
    const baseIssueMessages = new Set(
        (baseVideo.issues || []).map((i: any) => i.message?.toLowerCase().trim())
    );
    const currentIssueMessages = new Set(
        (currentVideo.issues || []).map((i: any) => i.message?.toLowerCase().trim())
    );

    const issuesWithStatus: IssueWithStatus[] = [];

    // Fixed issues: in base but not in current
    (baseVideo.issues || []).forEach((issue: any) => {
        const msg = issue.message?.toLowerCase().trim();
        if (!currentIssueMessages.has(msg)) {
            issuesWithStatus.push({
                message: issue.message,
                severity: issue.severity,
                suggestion: issue.suggestion,
                status: 'fixed',
            });
        }
    });

    // New issues: in current but not in base
    (currentVideo.issues || []).forEach((issue: any) => {
        const msg = issue.message?.toLowerCase().trim();
        if (!baseIssueMessages.has(msg)) {
            issuesWithStatus.push({
                message: issue.message,
                severity: issue.severity,
                suggestion: issue.suggestion,
                status: 'new',
            });
        }
    });

    // Unchanged issues: in both
    (currentVideo.issues || []).forEach((issue: any) => {
        const msg = issue.message?.toLowerCase().trim();
        if (baseIssueMessages.has(msg)) {
            issuesWithStatus.push({
                message: issue.message,
                severity: issue.severity,
                suggestion: issue.suggestion,
                status: 'unchanged',
            });
        }
    });

    const fixedCount = issuesWithStatus.filter(i => i.status === 'fixed').length;
    const newCount = issuesWithStatus.filter(i => i.status === 'new').length;
    const unchangedCount = issuesWithStatus.filter(i => i.status === 'unchanged').length;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 z-50"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal - Full width */}
            <div
                className="fixed inset-4 z-50 bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="compare-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
                    <h2 id="compare-modal-title" className="text-lg font-semibold text-white">
                        {tCompare('title')}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500">{tCompare('base')}</span>
                            <span className="text-white font-medium truncate max-w-[200px]">{baseVideo.title}</span>
                            <span className="text-gray-500">{tCompare('vs')}</span>
                            <span className="text-orange-400 font-medium truncate max-w-[200px]">{currentVideo.title}</span>
                            <span className="text-gray-500">({tCompare('current')})</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Video Preview Section */}
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-start">
                            {/* Base Video */}
                            <div className="space-y-3">
                                <div className="text-center text-sm text-gray-500 mb-2">BASE</div>
                                <div className="aspect-[9/16] max-h-[300px] mx-auto rounded-xl overflow-hidden bg-gray-900">
                                    {baseVideo.videoId && baseVideo.isShort ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${baseVideo.videoId}`}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : baseVideo.thumbnailUrl ? (
                                        <img src={baseVideo.thumbnailUrl} alt={baseVideo.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <span className="text-xs">{tAnalyzer('status.uploaded')}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Stats for base video */}
                                {baseVideo.videoUrl && (
                                    baseStatsLoading ? (
                                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>{tCompare('loadingStats')}</span>
                                        </div>
                                    ) : baseVideoStats ? (
                                        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" />
                                                {formatNumber(baseVideoStats.views)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5" />
                                                {formatNumber(baseVideoStats.likes)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatRelativeTime(baseVideoStats.publishedAt, tTime, tCompare)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatRelativeTime(baseVideo.completedAt, tTime, tCompare)}
                                        </div>
                                    )
                                )}
                                {!baseVideo.videoUrl && (
                                    <div className="text-center text-xs text-gray-500">
                                        {tCompare('analyzedAt', { date: formatRelativeTime(baseVideo.completedAt, tTime, tCompare) })}
                                    </div>
                                )}
                            </div>

                            {/* VS Divider */}
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="text-2xl font-bold text-gray-600">VS</div>
                            </div>

                            {/* Current Video */}
                            <div className="space-y-3">
                                <div className="text-center text-sm text-orange-500 mb-2">CURRENT</div>
                                <div className="aspect-[9/16] max-h-[300px] mx-auto rounded-xl overflow-hidden bg-gray-900">
                                    {currentVideo.videoId && currentVideo.isShort ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${currentVideo.videoId}`}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : currentVideo.videoUrl ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <span className="text-xs">{tAnalyzer('status.analyzing')}</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <span className="text-xs">{tAnalyzer('status.uploaded')}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Stats for current video */}
                                {currentVideo.stats && (
                                    <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" />
                                            {formatNumber(currentVideo.stats.views)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Heart className="w-3.5 h-3.5" />
                                            {formatNumber(currentVideo.stats.likes)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatRelativeTime(currentVideo.stats.publishedAt, tTime, tCompare)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-gray-800" />

                        {/* Overall Score Comparison */}
                        <div className="bg-gray-900/30 rounded-xl p-4">
                            <div className="flex items-center justify-center gap-8">
                                <div className="text-center">
                                    <div className={`text-4xl font-bold text-${getLetterGrade(baseVideo.scores.overall).color}-500`}>
                                        {getLetterGrade(baseVideo.scores.overall).label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{tCompare('baseScore')}</div>
                                </div>
                                <div className="text-center px-6">
                                    <div className="text-sm text-gray-500 mb-1">{tCompare('overall')}</div>
                                    {(() => {
                                        const delta = calculateDelta(currentVideo.scores.overall, baseVideo.scores.overall);
                                        return delta.hasChange ? (
                                            <span className={`text-lg font-semibold text-${delta.color}-500`}>
                                                {delta.text}
                                            </span>
                                        ) : (
                                            <span className="text-lg text-gray-500">=</span>
                                        );
                                    })()}
                                </div>
                                <div className="text-center">
                                    <div className={`text-4xl font-bold text-${getLetterGrade(currentVideo.scores.overall).color}-500`}>
                                        {getLetterGrade(currentVideo.scores.overall).label}
                                    </div>
                                    <div className="text-xs text-orange-500 mt-1">{tCompare('currentScore')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Hook Section */}
                        <div className="space-y-2">
                            <SectionHeader
                                title="Hook"
                                baseGrade={getLetterGrade(baseVideo.scores.hook)}
                                currentGrade={getLetterGrade(currentVideo.scores.hook)}
                                expanded={hookExpanded}
                                onToggle={() => setHookExpanded(!hookExpanded)}
                            />
                            {hookExpanded && (
                                <div className="bg-gray-900/20 rounded-lg p-4">
                                    {baseSignals?.hook && currentSignals?.hook ? (
                                        <>
                                            <MetricRow
                                                label={tAnalyzer('metrics.hook.ttc')}
                                                baseValue={`${baseSignals.hook.TTClaim}s`}
                                                currentValue={`${currentSignals.hook.TTClaim}s`}
                                                delta={calculateDelta(currentSignals.hook.TTClaim, baseSignals.hook.TTClaim, true)}
                                                tooltip={tAnalyzer('metrics.hook.tooltips.ttc')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.hook.pb')}
                                                baseValue={`${baseSignals.hook.PB}/5`}
                                                currentValue={`${currentSignals.hook.PB}/5`}
                                                delta={calculateDelta(currentSignals.hook.PB, baseSignals.hook.PB)}
                                                tooltip={tAnalyzer('metrics.hook.tooltips.pb')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.hook.spec')}
                                                baseValue={baseSignals.hook.Spec}
                                                currentValue={currentSignals.hook.Spec}
                                                delta={calculateDelta(currentSignals.hook.Spec, baseSignals.hook.Spec)}
                                                tooltip={tAnalyzer('metrics.hook.tooltips.spec')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.hook.qc')}
                                                baseValue={baseSignals.hook.QC > 0 ? tCommon('yes') : tCommon('no')}
                                                currentValue={currentSignals.hook.QC > 0 ? tCommon('yes') : tCommon('no')}
                                                delta={calculateDelta(currentSignals.hook.QC, baseSignals.hook.QC)}
                                                tooltip={tAnalyzer('metrics.hook.tooltips.qc')}
                                            />
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">
                                            {tCompare('noSignals', { type: 'hook' })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Structure Section */}
                        <div className="space-y-2">
                            <SectionHeader
                                title="Structure"
                                baseGrade={getLetterGrade(baseVideo.scores.structure)}
                                currentGrade={getLetterGrade(currentVideo.scores.structure)}
                                expanded={structureExpanded}
                                onToggle={() => setStructureExpanded(!structureExpanded)}
                            />
                            {structureExpanded && (
                                <div className="bg-gray-900/20 rounded-lg p-4">
                                    {baseSignals?.structure && currentSignals?.structure ? (
                                        <>
                                            <MetricRow
                                                label={tAnalyzer('beatsbybeat.beatsCount', { count: '' }).replace('{count}', '').trim()}
                                                baseValue={baseSignals.structure.BC}
                                                currentValue={currentSignals.structure.BC}
                                                delta={calculateDelta(currentSignals.structure.BC, baseSignals.structure.BC)}
                                                tooltip={tAnalyzer('metrics.structure.tooltips.beatCount')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.structure.progressMarkers')}
                                                baseValue={baseSignals.structure.PM}
                                                currentValue={currentSignals.structure.PM}
                                                delta={calculateDelta(currentSignals.structure.PM, baseSignals.structure.PM)}
                                                tooltip={tAnalyzer('metrics.structure.tooltips.progressMarkers')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.structure.hasPayoff')}
                                                baseValue={baseSignals.structure.PP ? tCommon('yes') : tCommon('no')}
                                                currentValue={currentSignals.structure.PP ? tCommon('yes') : tCommon('no')}
                                                delta={calculateDelta(currentSignals.structure.PP ? 1 : 0, baseSignals.structure.PP ? 1 : 0)}
                                                tooltip={tAnalyzer('metrics.structure.tooltips.hasPayoff')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.structure.loopCue')}
                                                baseValue={baseSignals.structure.LC ? tCommon('yes') : tCommon('no')}
                                                currentValue={currentSignals.structure.LC ? tCommon('yes') : tCommon('no')}
                                                delta={calculateDelta(currentSignals.structure.LC ? 1 : 0, baseSignals.structure.LC ? 1 : 0)}
                                                tooltip={tAnalyzer('metrics.structure.tooltips.loopCue')}
                                            />
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">
                                            {tCompare('noSignals', { type: 'structure' })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Clarity Section */}
                        <div className="space-y-2">
                            <SectionHeader
                                title="Clarity"
                                baseGrade={getLetterGrade(baseVideo.scores.clarity)}
                                currentGrade={getLetterGrade(currentVideo.scores.clarity)}
                                expanded={clarityExpanded}
                                onToggle={() => setClarityExpanded(!clarityExpanded)}
                            />
                            {clarityExpanded && (
                                <div className="bg-gray-900/20 rounded-lg p-4">
                                    {baseSignals?.clarity && currentSignals?.clarity ? (
                                        <>
                                            <MetricRow
                                                label={tAnalyzer('metrics.clarity.speakingPace')}
                                                baseValue={`${(baseSignals.clarity.wordCount / baseSignals.clarity.duration).toFixed(1)} w/s`}
                                                currentValue={`${(currentSignals.clarity.wordCount / currentSignals.clarity.duration).toFixed(1)} w/s`}
                                                tooltip={tAnalyzer('metrics.clarity.tooltips.speakingPace')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.clarity.complexity')}
                                                baseValue={`${baseSignals.clarity.SC}/5`}
                                                currentValue={`${currentSignals.clarity.SC}/5`}
                                                delta={calculateDelta(currentSignals.clarity.SC, baseSignals.clarity.SC, true)}
                                                tooltip={tAnalyzer('metrics.clarity.tooltips.complexity')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.clarity.topicJumps')}
                                                baseValue={baseSignals.clarity.TJ}
                                                currentValue={currentSignals.clarity.TJ}
                                                delta={calculateDelta(currentSignals.clarity.TJ, baseSignals.clarity.TJ, true)}
                                                tooltip={tAnalyzer('metrics.clarity.tooltips.topicJumps')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.clarity.redundancy')}
                                                baseValue={`${baseSignals.clarity.RD}/5`}
                                                currentValue={`${currentSignals.clarity.RD}/5`}
                                                delta={calculateDelta(currentSignals.clarity.RD, baseSignals.clarity.RD, true)}
                                                tooltip={tAnalyzer('metrics.clarity.tooltips.redundancy')}
                                            />
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">
                                            {tCompare('noSignals', { type: 'clarity' })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Delivery Section */}
                        <div className="space-y-2">
                            <SectionHeader
                                title="Delivery"
                                baseGrade={getLetterGrade(baseVideo.scores.delivery)}
                                currentGrade={getLetterGrade(currentVideo.scores.delivery)}
                                expanded={deliveryExpanded}
                                onToggle={() => setDeliveryExpanded(!deliveryExpanded)}
                            />
                            {deliveryExpanded && (
                                <div className="bg-gray-900/20 rounded-lg p-4">
                                    {baseSignals?.delivery && currentSignals?.delivery ? (
                                        <>
                                            <MetricRow
                                                label={tAnalyzer('metrics.delivery.volumeConsistency')}
                                                baseValue={`${baseSignals.delivery.LS}/5`}
                                                currentValue={`${currentSignals.delivery.LS}/5`}
                                                delta={calculateDelta(currentSignals.delivery.LS, baseSignals.delivery.LS)}
                                                tooltip={tAnalyzer('metrics.delivery.tooltips.volumeConsistency')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.delivery.audioQuality')}
                                                baseValue={`${baseSignals.delivery.NS}/5`}
                                                currentValue={`${currentSignals.delivery.NS}/5`}
                                                delta={calculateDelta(currentSignals.delivery.NS, baseSignals.delivery.NS)}
                                                tooltip={tAnalyzer('metrics.delivery.tooltips.audioQuality')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.delivery.fillerWords')}
                                                baseValue={baseSignals.delivery.fillerCount}
                                                currentValue={currentSignals.delivery.fillerCount}
                                                delta={calculateDelta(currentSignals.delivery.fillerCount, baseSignals.delivery.fillerCount, true)}
                                                tooltip={tAnalyzer('metrics.delivery.tooltips.fillerWords')}
                                            />
                                            <MetricRow
                                                label={tAnalyzer('metrics.delivery.energyVariation')}
                                                baseValue={baseSignals.delivery.EC ? tCommon('yes') : tCommon('no')}
                                                currentValue={currentSignals.delivery.EC ? tCommon('yes') : tCommon('no')}
                                                delta={calculateDelta(currentSignals.delivery.EC ? 1 : 0, baseSignals.delivery.EC ? 1 : 0)}
                                                tooltip={tAnalyzer('metrics.delivery.tooltips.energyVariation')}
                                            />
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">
                                            {tCompare('noSignals', { type: 'delivery' })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Separator */}
                        <div className="border-t border-gray-800" />

                        {/* Issues Comparison */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setIssuesExpanded(!issuesExpanded)}
                                className="w-full flex items-center justify-between py-3 px-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-white">{tCompare('issues.title')}</span>
                                    <div className="flex items-center gap-3 text-xs">
                                        {fixedCount > 0 && (
                                            <span className="flex items-center gap-1 text-green-500">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {tCompare('issues.fixed', { count: fixedCount })}
                                            </span>
                                        )}
                                        {newCount > 0 && (
                                            <span className="flex items-center gap-1 text-red-500">
                                                <Plus className="w-3.5 h-3.5" />
                                                {tCompare('issues.new', { count: newCount })}
                                            </span>
                                        )}
                                        {unchangedCount > 0 && (
                                            <span className="flex items-center gap-1 text-gray-500">
                                                <Minus className="w-3.5 h-3.5" />
                                                {tCompare('issues.unchanged', { count: unchangedCount })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {issuesExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </button>

                            {issuesExpanded && (
                                <div className="bg-gray-900/20 rounded-lg p-4 space-y-3">
                                    {issuesWithStatus.length === 0 ? (
                                        <div className="text-center text-gray-500 text-sm py-4">
                                            {tCompare('issues.none')}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Fixed Issues */}
                                            {issuesWithStatus.filter(i => i.status === 'fixed').map((issue, idx) => (
                                                <div key={`fixed-${idx}`} className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-medium">
                                                                {tCompare('issues.status.fixed')}
                                                            </span>
                                                            <span className="text-xs text-gray-500 capitalize">{tAnalyzer(`beatsbybeat.severity.${issue.severity as 'critical' | 'moderate' | 'minor'}`)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-300">{issue.message}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* New Issues */}
                                            {issuesWithStatus.filter(i => i.status === 'new').map((issue, idx) => (
                                                <div key={`new-${idx}`} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                                    <Plus className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-medium">
                                                                {tCompare('issues.status.new')}
                                                            </span>
                                                            <span className="text-xs text-gray-500 capitalize">{tAnalyzer(`beatsbybeat.severity.${issue.severity as 'critical' | 'moderate' | 'minor'}`)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-300">{issue.message}</p>
                                                        {issue.suggestion && (
                                                            <p className="text-xs text-gray-500 mt-1">💡 {issue.suggestion}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Unchanged Issues */}
                                            {issuesWithStatus.filter(i => i.status === 'unchanged').map((issue, idx) => (
                                                <div key={`unchanged-${idx}`} className="flex items-start gap-3 p-3 bg-gray-500/5 border border-gray-700 rounded-lg">
                                                    <Minus className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded font-medium">
                                                                {tCompare('issues.status.unchanged')}
                                                            </span>
                                                            <span className="text-xs text-gray-500 capitalize">{tAnalyzer(`beatsbybeat.severity.${issue.severity as 'critical' | 'moderate' | 'minor'}`)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-400">{issue.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
