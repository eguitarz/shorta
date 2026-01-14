'use client';

import { Brain } from 'lucide-react';

interface LearningIndicatorProps {
  isVisible: boolean;
}

export function LearningIndicator({ isVisible }: LearningIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium animate-pulse z-50">
      <Brain className="w-4 h-4" />
      <span>Learning your style preferences...</span>
    </div>
  );
}
