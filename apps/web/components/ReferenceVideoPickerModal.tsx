'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, Video, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ReferenceVideo {
    id: string;
    title: string;
    thumbnailUrl?: string;
    score: number | null;
    niche: string | null;
    hookCategory: string | null;
}

interface ReferenceVideoPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (video: ReferenceVideo) => void;
}

interface LibraryItem {
    id: string;
    title: string | null;
    video_url: string | null;
    deterministic_score: number | null;
    niche_category: string | null;
    hook_category: string | null;
    starred: boolean;
    created_at: string;
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

// Extract YouTube video ID and get thumbnail
const getYouTubeThumbnail = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
};

// Format relative time
const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

export function ReferenceVideoPickerModal({ isOpen, onClose, onSelect }: ReferenceVideoPickerModalProps) {
    const t = useTranslations('analyzer.referencePicker');
    const tAnalyzer = useTranslations('analyzer');

    const [activeTab, setActiveTab] = useState<'starred' | 'all'>('starred');
    const [videos, setVideos] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [starredCount, setStarredCount] = useState(0);

    // Fetch videos when modal opens or tab changes
    useEffect(() => {
        if (!isOpen) return;

        const fetchVideos = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    limit: '50',
                    sortBy: 'deterministic_score',
                    sortOrder: 'desc',
                });

                if (activeTab === 'starred') {
                    params.set('starred', 'true');
                }

                if (searchQuery) {
                    params.set('search', searchQuery);
                }

                const response = await fetch(`/api/library?${params}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch videos');
                }

                setVideos(data.items || []);

                // Fetch starred count for badge
                if (activeTab === 'all') {
                    const filtersResponse = await fetch('/api/library/filters');
                    if (filtersResponse.ok) {
                        const filtersData = await filtersResponse.json();
                        setStarredCount(filtersData.counts?.starred || 0);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch videos:', err);
                setError(err instanceof Error ? err.message : 'Failed to load videos');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [isOpen, activeTab, searchQuery]);

    // Fetch starred count on initial open
    useEffect(() => {
        if (!isOpen) return;

        const fetchStarredCount = async () => {
            try {
                const response = await fetch('/api/library/filters');
                if (response.ok) {
                    const data = await response.json();
                    setStarredCount(data.counts?.starred || 0);
                }
            } catch (err) {
                // Ignore errors for count
            }
        };

        fetchStarredCount();
    }, [isOpen]);

    const handleSelect = (item: LibraryItem) => {
        const referenceVideo: ReferenceVideo = {
            id: item.id,
            title: item.title || 'Untitled',
            thumbnailUrl: getYouTubeThumbnail(item.video_url) || undefined,
            score: item.deterministic_score,
            niche: item.niche_category,
            hookCategory: item.hook_category,
        };
        onSelect(referenceVideo);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 z-50"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0a0a0a] border border-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reference-picker-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 id="reference-picker-title" className="text-lg font-semibold text-white">
                        {t('title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('starred')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'starred'
                                ? 'text-orange-400'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Star className="w-4 h-4" />
                            {t('tabs.starred')}
                            {starredCount > 0 && (
                                <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
                                    {starredCount}
                                </span>
                            )}
                        </span>
                        {activeTab === 'starred' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'all'
                                ? 'text-orange-400'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        {t('tabs.all')}
                        {activeTab === 'all' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                        />
                    </div>
                </div>

                {/* Videos List */}
                <div className="overflow-y-auto max-h-[calc(80vh-200px)] p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            <p className="text-sm text-gray-400">{t('loading')}</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-400 mb-2">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-sm text-orange-500 hover:underline"
                            >
                                {t('tryAgain')}
                            </button>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="text-center py-12">
                            <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">
                                {searchQuery
                                    ? t('noResults')
                                    : activeTab === 'starred'
                                        ? t('noStarred')
                                        : t('noVideos')
                                }
                            </p>
                            {activeTab === 'starred' && !searchQuery && (
                                <p className="text-sm text-gray-500 mt-2">
                                    {t('starHint')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {videos.map((video) => {
                                const grade = getLetterGrade(video.deterministic_score);
                                const thumbnailUrl = getYouTubeThumbnail(video.video_url);
                                return (
                                    <button
                                        key={video.id}
                                        onClick={() => handleSelect(video)}
                                        className="flex items-center gap-4 p-3 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-lg transition-all text-left group"
                                    >
                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-gray-800">
                                            {thumbnailUrl ? (
                                                <img
                                                    src={thumbnailUrl}
                                                    alt={video.title || 'Video thumbnail'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Video className="w-6 h-6 text-gray-600" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-white truncate group-hover:text-orange-400 transition-colors">
                                                    {video.title || 'Untitled'}
                                                </h3>
                                                {video.starred && (
                                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{formatRelativeTime(video.created_at)}</span>
                                                {video.niche_category && (
                                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                                                        {video.niche_category}
                                                    </span>
                                                )}
                                                {video.hook_category && (
                                                    <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                                                        {video.hook_category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                            grade.color === 'purple' ? 'bg-purple-500/10' :
                                            grade.color === 'green' ? 'bg-green-500/10' :
                                            grade.color === 'blue' ? 'bg-blue-500/10' :
                                            grade.color === 'yellow' ? 'bg-yellow-500/10' :
                                            grade.color === 'orange' ? 'bg-orange-500/10' :
                                            grade.color === 'red' ? 'bg-red-500/10' :
                                            'bg-gray-500/10'
                                        }`}>
                                            <span className={`text-lg font-bold ${
                                                grade.color === 'purple' ? 'text-purple-500' :
                                                grade.color === 'green' ? 'text-green-500' :
                                                grade.color === 'blue' ? 'text-blue-500' :
                                                grade.color === 'yellow' ? 'text-yellow-500' :
                                                grade.color === 'orange' ? 'text-orange-500' :
                                                grade.color === 'red' ? 'text-red-500' :
                                                'text-gray-500'
                                            }`}>
                                                {tAnalyzer(`grades.letters.${grade.label as any}`)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
