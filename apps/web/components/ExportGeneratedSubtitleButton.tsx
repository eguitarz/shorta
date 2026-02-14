'use client';

import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface GeneratedBeat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  script: string;
}

interface ExportGeneratedSubtitleButtonProps {
  beats: GeneratedBeat[];
  videoTitle?: string;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function ExportGeneratedSubtitleButton({ beats, videoTitle = 'video' }: ExportGeneratedSubtitleButtonProps) {
  const t = useTranslations('storyboard.export');

  const handleExport = () => {
    // Generate SRT format
    let srtContent = '';

    beats.forEach((beat, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(beat.startTime)} --> ${formatTime(beat.endTime)}\n`;
      srtContent += `${beat.script}\n\n`;
    });

    // Create and download file
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${videoTitle.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, '_')}_subtitles.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      title={t('subtitle')}
    >
      <FileText className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-400">{t('subtitle')}</span>
    </button>
  );
}
