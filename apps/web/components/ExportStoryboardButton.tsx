'use client';

import { FileType } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Beat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
  title: string;
  transcript: string;
  visual: string;
  audio: string;
  retention: {
    level: string;
    analysis: string;
  };
}

interface AnalysisData {
  url: string;
  storyboard: {
    overview: {
      title: string;
      length: number;
      hookCategory: string;
      hookPattern: string;
      nicheCategory: string;
      nicheDescription: string;
      contentType: string;
      targetAudience: string;
    };
    beats: Beat[];
    performance: {
      score: number;
      hookStrength: number;
      structurePacing: number;
      deliveryPerformance: number;
      directorAssessment: string;
    };
  };
}

interface ExportStoryboardButtonProps {
  analysisData: AnalysisData;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function ExportStoryboardButton({ analysisData }: ExportStoryboardButtonProps) {
  const t = useTranslations('analyzer');
  const handleExport = () => {
    const { storyboard } = analysisData;

    // Generate text content
    let content = '';

    // Overview section
    content += '='.repeat(80) + '\n';
    content += 'STORYBOARD ANALYSIS\n';
    content += '='.repeat(80) + '\n\n';

    content += `Title: ${storyboard.overview.title}\n`;
    content += `Length: ${storyboard.overview.length} seconds\n`;
    content += `Content Type: ${storyboard.overview.contentType}\n`;
    content += `Hook Category: ${storyboard.overview.hookCategory}\n`;
    content += `Hook Pattern: ${storyboard.overview.hookPattern}\n`;
    content += `Niche: ${storyboard.overview.nicheCategory}\n`;
    content += `Target Audience: ${storyboard.overview.targetAudience}\n\n`;

    // Performance section
    content += '-'.repeat(80) + '\n';
    content += 'PERFORMANCE METRICS\n';
    content += '-'.repeat(80) + '\n\n';

    content += `Overall Score: ${storyboard.performance.score}/100\n`;
    content += `Hook Strength: ${storyboard.performance.hookStrength}%\n`;
    content += `Structure & Pacing: ${storyboard.performance.structurePacing}%\n`;
    content += `Delivery Performance: ${storyboard.performance.deliveryPerformance}%\n\n`;
    content += `Director Assessment:\n${storyboard.performance.directorAssessment}\n\n`;

    // Beats section
    content += '-'.repeat(80) + '\n';
    content += 'BEAT-BY-BEAT BREAKDOWN\n';
    content += '-'.repeat(80) + '\n\n';

    storyboard.beats.forEach((beat) => {
      content += `Beat ${beat.beatNumber}: ${beat.title}\n`;
      content += `Time: ${formatTime(beat.startTime)} - ${formatTime(beat.endTime)} (${beat.type})\n`;
      content += `Retention: ${beat.retention.level}\n\n`;

      content += `Transcript:\n"${beat.transcript}"\n\n`;

      content += `Visual:\n${beat.visual}\n\n`;

      content += `Audio:\n${beat.audio}\n\n`;

      content += `Analysis:\n${beat.retention.analysis}\n\n`;

      content += '-'.repeat(80) + '\n\n';
    });

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = storyboard.overview.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${filename}_storyboard.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      title={t('export.storyboard')}
    >
      <FileType className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-400">{t('export.storyboard')}</span>
    </button>
  );
}
