'use client';

import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { SEVERITY_ORDER, type SeverityLevel } from '@/lib/preferences/issue-key';

interface SeverityVoteButtonsProps {
  currentSeverity: string;
  originalSeverity: string;
  isLoggedIn: boolean;
  onVoteUp: () => Promise<void>;
  onVoteDown: () => Promise<void>;
  onReset: () => Promise<void>;
  disabled?: boolean;
}

export function SeverityVoteButtons({
  currentSeverity,
  originalSeverity,
  isLoggedIn,
  onVoteUp,
  onVoteDown,
  onReset,
  disabled = false,
}: SeverityVoteButtonsProps) {
  if (!isLoggedIn) {
    return null;
  }

  const severityIdx = SEVERITY_ORDER.indexOf(currentSeverity as SeverityLevel);
  const canVoteUp = severityIdx > 0;
  const canVoteDown = severityIdx < SEVERITY_ORDER.length - 1;
  const isModified = currentSeverity !== originalSeverity;

  return (
    <div className="flex items-center gap-0.5">
      {/* Vote Up (more severe) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVoteUp();
        }}
        disabled={disabled || !canVoteUp}
        className={`p-0.5 rounded transition-colors ${
          canVoteUp && !disabled
            ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
            : 'text-gray-700 cursor-not-allowed'
        }`}
        title={canVoteUp ? 'More severe' : 'Already at maximum severity'}
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      {/* Vote Down (less severe) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVoteDown();
        }}
        disabled={disabled || !canVoteDown}
        className={`p-0.5 rounded transition-colors ${
          canVoteDown && !disabled
            ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
            : 'text-gray-700 cursor-not-allowed'
        }`}
        title={canVoteDown ? 'Less severe / ignore' : 'Already ignored'}
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {/* Reset button (only shown if modified) */}
      {isModified && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          disabled={disabled}
          className="p-0.5 rounded hover:bg-gray-700 text-purple-400 hover:text-purple-300 transition-colors ml-0.5"
          title={`Reset to original: ${originalSeverity}`}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
