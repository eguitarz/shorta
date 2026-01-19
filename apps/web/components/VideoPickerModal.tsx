'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface UserVideo {
    id: string;
    title: string;
    videoUrl: string | null;
    fileUri: string | null;
    isShort: boolean;
    videoId: string | null;
    thumbnailUrl: string | null;
    createdAt: string;
    completedAt: string;
    scores: {
        overall: number | null;
        hook: number | null;
        structure: number | null;
        delivery: number | null;
        clarity: number | null;
    };
    metadata: {
        format: string | null;
        hookCategory: string | null;
        niche: string | null;
        contentType: string | null;
    };
    storyboard: any;
    lintResult: any;
    issues: any[];
}

interface VideoPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (video: UserVideo) => void;
    excludeJobId?: string;
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

// Format relative time
const formatRelativeTime = (dateString: string, tTime: any): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return tTime('m_ago', { count: diffMins });
    if (diffHours < 24) return tTime('h_ago', { count: diffHours });
    if (diffDays < 7) return tTime('d_ago', { count: diffDays });
    return date.toLocaleDateString();
};

export function VideoPickerModal({ isOpen, onClose, onSelect, excludeJobId }: VideoPickerModalProps) {
    const tPicker = useTranslations('picker');
    const tAnalyzer = useTranslations('analyzer');
    const tTime = useTranslations('time');

    const [videos, setVideos] = useState<UserVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch user's videos on mount
    useEffect(() => {
        if (!isOpen) return;

        const fetchVideos = async () => {
            setLoading(true);
            setError(null);
            try {
                const url = excludeJobId
                    ? `/api/analyses/user-videos?exclude=${excludeJobId}`
                    : '/api/analyses/user-videos';
                const response = await fetch(url);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch videos');
                }

                setVideos(data.videos || []);
            } catch (err) {
                console.error('Failed to fetch videos:', err);
                setError(err instanceof Error ? err.message : 'Failed to load videos');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [isOpen, excludeJobId]);

    // Filter videos by search query
    const filteredVideos = videos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.metadata.niche?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.metadata.contentType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                aria-labelledby="picker-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 id="picker-modal-title" className="text-lg font-semibold text-white">
                        {tPicker('title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={tPicker('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                        />
                    </div>
                </div>

                {/* Videos List */}
                <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            <p className="text-sm text-gray-400">{tPicker('loading')}</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-400 mb-2">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-sm text-orange-500 hover:underline"
                            >
                                {tPicker('tryAgain')}
                            </button>
                        </div>
                    ) : filteredVideos.length === 0 ? (
                        <div className="text-center py-12">
                            <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">
                                {searchQuery ? tPicker('noResults') : tPicker('noVideos')}
                            </p>
                            {!searchQuery && (
                                <p className="text-sm text-gray-500 mt-2">
                                    {tPicker('noVideosHint')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredVideos.map((video) => {
                                const grade = getLetterGrade(video.scores.overall);
                                return (
                                    <button
                                        key={video.id}
                                        onClick={() => onSelect(video)}
                                        className="flex items-center gap-4 p-3 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-lg transition-all text-left group"
                                    >
                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-gray-800">
                                            {video.thumbnailUrl ? (
                                                <img
                                                    src={video.thumbnailUrl}
                                                    alt={video.title}
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
                                            <h3 className="font-medium text-white truncate group-hover:text-orange-400 transition-colors">
                                                {video.title}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{formatRelativeTime(video.completedAt, tTime)}</span>
                                                {video.metadata.niche && (
                                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                                                        {video.metadata.niche}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-${grade.color}-500/10 flex items-center justify-center`}>
                                            <span className={`text-lg font-bold text-${grade.color}-500`}>
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
