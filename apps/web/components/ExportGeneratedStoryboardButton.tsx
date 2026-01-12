'use client';

import { FileType } from 'lucide-react';

interface GeneratedBeat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
  title: string;
  directorNotes: string | string[];
  script: string;
  visual: string;
  audio: string;
}

interface GeneratedData {
  url?: string;
  generated: {
    overview: {
      title: string;
      contentType?: string;
      nicheCategory?: string;
      targetAudience?: string;
      hookCategory?: string;
      hookPattern?: string;
    };
    beats: GeneratedBeat[];
  };
  appliedChanges?: any[];
}

interface ExportGeneratedStoryboardButtonProps {
  generatedData: GeneratedData;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function ExportGeneratedStoryboardButton({ generatedData }: ExportGeneratedStoryboardButtonProps) {
  const handleExport = () => {
    const { generated } = generatedData;

    // Generate text content
    let content = '';

    // Overview section
    content += '='.repeat(80) + '\n';
    content += 'DIRECTOR\'S STORYBOARD\n';
    content += '='.repeat(80) + '\n\n';

    content += `Title: ${generated.overview.title}\n`;
    if (generated.overview.contentType) {
      content += `Content Type: ${generated.overview.contentType}\n`;
    }
    if (generated.overview.nicheCategory) {
      content += `Niche: ${generated.overview.nicheCategory}\n`;
    }
    if (generated.overview.targetAudience) {
      content += `Target Audience: ${generated.overview.targetAudience}\n`;
    }
    if (generated.overview.hookCategory) {
      content += `Hook Category: ${generated.overview.hookCategory}\n`;
    }
    if (generated.overview.hookPattern) {
      content += `Hook Pattern: ${generated.overview.hookPattern}\n`;
    }
    content += '\n';

    if (generatedData.appliedChanges && generatedData.appliedChanges.length > 0) {
      content += `Applied Changes: ${generatedData.appliedChanges.length}\n\n`;
    }

    // Beats section
    content += '-'.repeat(80) + '\n';
    content += 'BEAT-BY-BEAT DIRECTOR\'S GUIDE\n';
    content += '-'.repeat(80) + '\n\n';

    generated.beats.forEach((beat) => {
      content += `Beat ${beat.beatNumber}: ${beat.title}\n`;
      content += `Time: ${formatTime(beat.startTime)} - ${formatTime(beat.endTime)} (${beat.type})\n\n`;

      const notes = Array.isArray(beat.directorNotes)
        ? beat.directorNotes.join('\n')
        : beat.directorNotes;
      content += `DIRECTOR NOTES:\n${notes}\n\n`;

      content += `Script:\n"${beat.script}"\n\n`;

      content += `Visual:\n${beat.visual}\n\n`;

      content += `Audio:\n${beat.audio}\n\n`;

      content += '-'.repeat(80) + '\n\n';
    });

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = generated.overview.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
      title="Export storyboard as text"
    >
      <FileType className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-400">Export Storyboard</span>
    </button>
  );
}
