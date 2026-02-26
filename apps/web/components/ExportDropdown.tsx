'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, FileType, FileDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BeatImageMap } from '@/lib/image-generation/types';

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

interface ExportDropdownProps {
  overview: {
    title: string;
    contentType?: string;
    nicheCategory?: string;
    targetAudience?: string;
    hookCategory?: string;
    hookPattern?: string;
  };
  beats: GeneratedBeat[];
  appliedChanges?: any[];
  beatImages?: BeatImageMap;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function sanitizeFilename(title: string): string {
  return title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, '_');
}

export function ExportDropdown({ overview, beats, appliedChanges, beatImages }: ExportDropdownProps) {
  const t = useTranslations('storyboard.export');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportSubtitle = () => {
    let srtContent = '';
    beats.forEach((beat, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatSrtTime(beat.startTime)} --> ${formatSrtTime(beat.endTime)}\n`;
      srtContent += `${beat.script}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${sanitizeFilename(overview.title)}_subtitles.srt`);
    setIsOpen(false);
  };

  const handleExportStoryboard = () => {
    let content = '';
    content += '='.repeat(80) + '\n';
    content += 'DIRECTOR\'S STORYBOARD\n';
    content += '='.repeat(80) + '\n\n';

    content += `Title: ${overview.title}\n`;
    if (overview.contentType) content += `Content Type: ${overview.contentType}\n`;
    if (overview.nicheCategory) content += `Niche: ${overview.nicheCategory}\n`;
    if (overview.targetAudience) content += `Target Audience: ${overview.targetAudience}\n`;
    if (overview.hookCategory) content += `Hook Category: ${overview.hookCategory}\n`;
    if (overview.hookPattern) content += `Hook Pattern: ${overview.hookPattern}\n`;
    content += '\n';

    if (appliedChanges && appliedChanges.length > 0) {
      content += `Applied Changes: ${appliedChanges.length}\n\n`;
    }

    content += '-'.repeat(80) + '\n';
    content += 'BEAT-BY-BEAT DIRECTOR\'S GUIDE\n';
    content += '-'.repeat(80) + '\n\n';

    beats.forEach((beat) => {
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

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${sanitizeFilename(overview.title)}_storyboard.txt`);
    setIsOpen(false);
  };

  const handleExportPDF = async () => {
    setIsOpen(false);

    // Dynamically import jspdf to avoid SSR issues
    const { default: jsPDF } = await import('jspdf');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (height: number) => {
      if (y + height > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    // Title page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    y = 40;
    const titleLines = pdf.splitTextToSize(overview.title, contentWidth);
    pdf.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += titleLines.length * 10 + 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);

    if (overview.contentType) {
      pdf.text(`Content Type: ${overview.contentType}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }
    if (overview.nicheCategory) {
      pdf.text(`Niche: ${overview.nicheCategory}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }
    if (overview.targetAudience) {
      pdf.text(`Target Audience: ${overview.targetAudience}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    pdf.setTextColor(0);
    y += 10;

    // Divider line
    pdf.setDrawColor(200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Beats
    for (const beat of beats) {
      checkPageBreak(60);

      // Beat header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 60, 150); // Purple-ish
      pdf.text(`Beat ${beat.beatNumber}: ${beat.title}`, margin, y);
      y += 6;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120);
      pdf.text(`${formatTime(beat.startTime)} - ${formatTime(beat.endTime)}  |  ${beat.type}`, margin, y);
      y += 8;

      pdf.setTextColor(0);

      // Beat image (if available)
      const imageData = beatImages?.[beat.beatNumber.toString()];
      if (imageData?.url) {
        try {
          // Fetch image and convert to base64 for jsPDF
          const response = await fetch(imageData.url);
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);

          checkPageBreak(70);
          // 9:16 aspect ratio: width = 30mm, height = 53.3mm
          const imgWidth = 30;
          const imgHeight = 53.3;
          pdf.addImage(base64, 'PNG', margin, y, imgWidth, imgHeight);

          // Script next to image
          const scriptX = margin + imgWidth + 5;
          const scriptWidth = contentWidth - imgWidth - 5;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Script:', scriptX, y + 4);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          const scriptLines = pdf.splitTextToSize(beat.script, scriptWidth);
          const maxScriptLines = Math.min(scriptLines.length, 12);
          pdf.text(scriptLines.slice(0, maxScriptLines), scriptX, y + 10);

          y += Math.max(imgHeight, maxScriptLines * 4.5 + 10) + 5;
        } catch {
          // Image fetch failed, continue without it
          printScriptSection(pdf, beat, margin, contentWidth, y);
          const scriptLines = pdf.splitTextToSize(beat.script, contentWidth);
          y += scriptLines.length * 4.5 + 12;
        }
      } else {
        // No image - just script
        printScriptSection(pdf, beat, margin, contentWidth, y);
        const scriptLines = pdf.splitTextToSize(beat.script, contentWidth);
        y += scriptLines.length * 4.5 + 12;
      }

      checkPageBreak(30);

      // Director Notes
      const notes = Array.isArray(beat.directorNotes)
        ? beat.directorNotes.join('\n')
        : beat.directorNotes;
      if (notes) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100);
        pdf.text('Director Notes:', margin, y);
        y += 4;
        pdf.setFont('helvetica', 'normal');
        const noteLines = pdf.splitTextToSize(notes, contentWidth);
        const maxNoteLines = Math.min(noteLines.length, 6);
        pdf.text(noteLines.slice(0, maxNoteLines), margin, y);
        y += maxNoteLines * 3.8 + 3;
        pdf.setTextColor(0);
      }

      checkPageBreak(20);

      // Visual & Audio side by side
      const halfWidth = contentWidth / 2 - 2;
      pdf.setFontSize(9);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100);
      pdf.text('Visual:', margin, y);
      pdf.text('Audio:', margin + halfWidth + 4, y);
      y += 4;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const visualLines = pdf.splitTextToSize(beat.visual, halfWidth);
      const audioLines = pdf.splitTextToSize(beat.audio, halfWidth);
      const maxVisual = Math.min(visualLines.length, 5);
      const maxAudio = Math.min(audioLines.length, 5);
      pdf.text(visualLines.slice(0, maxVisual), margin, y);
      pdf.text(audioLines.slice(0, maxAudio), margin + halfWidth + 4, y);
      y += Math.max(maxVisual, maxAudio) * 3.8 + 5;
      pdf.setTextColor(0);

      // Beat separator
      checkPageBreak(5);
      pdf.setDrawColor(230);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
    }

    // Save
    pdf.save(`${sanitizeFilename(overview.title)}_storyboard.pdf`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <FileDown className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">{t('button')}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
          <button
            onClick={handleExportSubtitle}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-gray-400" />
            {t('subtitle')}
          </button>
          <button
            onClick={handleExportStoryboard}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <FileType className="w-4 h-4 text-gray-400" />
            {t('storyboard')}
          </button>
          <div className="border-t border-gray-700" />
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <FileDown className="w-4 h-4 text-red-400" />
            {t('pdf')}
          </button>
        </div>
      )}
    </div>
  );
}

function printScriptSection(
  pdf: any,
  beat: { script: string },
  margin: number,
  contentWidth: number,
  y: number
) {
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Script:', margin, y);
  pdf.setFont('helvetica', 'normal');
  const scriptLines = pdf.splitTextToSize(beat.script, contentWidth);
  pdf.text(scriptLines, margin, y + 5);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
