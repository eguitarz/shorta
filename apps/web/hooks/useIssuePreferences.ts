'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getIssueKey,
  SEVERITY_POINTS,
  getNextSeverity,
  getPrevSeverity,
} from '@/lib/preferences/issue-key';

interface IssuePreference {
  severity: string;
  original_severity: string;
}

interface IssueInput {
  ruleId?: string;
  message: string;
  severity: string;
}

interface UseIssuePreferencesReturn {
  preferences: Record<string, IssuePreference>;
  isLoading: boolean;
  isLearning: boolean;
  getEffectiveSeverity: (issue: IssueInput) => string;
  voteUp: (issue: IssueInput) => Promise<void>;
  voteDown: (issue: IssueInput) => Promise<void>;
  resetPreference: (issue: { ruleId?: string; message: string }) => Promise<void>;
  calculateAdjustedScore: (originalScore: number, issues: IssueInput[]) => number;
  hasPreference: (issue: { ruleId?: string; message: string }) => boolean;
}

export function useIssuePreferences(
  isLoggedIn: boolean
): UseIssuePreferencesReturn {
  const [preferences, setPreferences] = useState<
    Record<string, IssuePreference>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLearning, setIsLearning] = useState(false);

  // Fetch preferences on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }

    async function fetchPreferences() {
      try {
        const response = await fetch('/api/preferences/issues');
        const data = await response.json();
        setPreferences(data.preferences || {});
      } catch (error) {
        console.error('[Preferences] Failed to fetch:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, [isLoggedIn]);

  // Get effective severity (user preference or original)
  const getEffectiveSeverity = useCallback(
    (issue: IssueInput): string => {
      const key = getIssueKey(issue);
      const pref = preferences[key];
      return pref?.severity || issue.severity;
    },
    [preferences]
  );

  // Check if issue has a custom preference
  const hasPreference = useCallback(
    (issue: { ruleId?: string; message: string }): boolean => {
      const key = getIssueKey({ ...issue, message: issue.message });
      return key in preferences;
    },
    [preferences]
  );

  // Save preference to backend
  const savePreference = async (
    issueKey: string,
    severity: string,
    originalSeverity: string
  ) => {
    setIsLearning(true);
    try {
      const response = await fetch('/api/preferences/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_key: issueKey,
          severity,
          original_severity: originalSeverity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preference');
      }

      // Update local state
      setPreferences((prev) => ({
        ...prev,
        [issueKey]: { severity, original_severity: originalSeverity },
      }));
    } catch (error) {
      console.error('[Preferences] Failed to save:', error);
      throw error;
    } finally {
      // Keep learning indicator visible briefly
      setTimeout(() => setIsLearning(false), 500);
    }
  };

  // Vote up (make more severe)
  const voteUp = useCallback(
    async (issue: IssueInput) => {
      if (!isLoggedIn) return;

      const key = getIssueKey(issue);
      const currentSeverity = getEffectiveSeverity(issue);
      const prevSeverity = getPrevSeverity(currentSeverity);

      if (prevSeverity) {
        await savePreference(key, prevSeverity, issue.severity);
      }
    },
    [isLoggedIn, getEffectiveSeverity]
  );

  // Vote down (make less severe)
  const voteDown = useCallback(
    async (issue: IssueInput) => {
      if (!isLoggedIn) return;

      const key = getIssueKey(issue);
      const currentSeverity = getEffectiveSeverity(issue);
      const nextSeverity = getNextSeverity(currentSeverity);

      if (nextSeverity) {
        await savePreference(key, nextSeverity, issue.severity);
      }
    },
    [isLoggedIn, getEffectiveSeverity]
  );

  // Reset to original
  const resetPreference = useCallback(
    async (issue: { ruleId?: string; message: string }) => {
      if (!isLoggedIn) return;

      const key = getIssueKey({ ...issue, message: issue.message });

      try {
        setIsLearning(true);
        const response = await fetch(
          `/api/preferences/issues/${encodeURIComponent(key)}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to reset preference');
        }

        // Remove from local state
        setPreferences((prev) => {
          const newPrefs = { ...prev };
          delete newPrefs[key];
          return newPrefs;
        });
      } catch (error) {
        console.error('[Preferences] Failed to reset:', error);
        throw error;
      } finally {
        setTimeout(() => setIsLearning(false), 500);
      }
    },
    [isLoggedIn]
  );

  // Calculate adjusted score based on preferences
  const calculateAdjustedScore = useCallback(
    (originalScore: number, issues: IssueInput[]): number => {
      if (Object.keys(preferences).length === 0) {
        return originalScore;
      }

      // Start fresh and recalculate deductions
      let adjustedScore = 100;

      // Deduplicate issues by key (same rule only counts once)
      const seenKeys = new Set<string>();

      issues.forEach((issue) => {
        const key = getIssueKey(issue);
        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        const effectiveSeverity = getEffectiveSeverity(issue);
        adjustedScore += SEVERITY_POINTS[effectiveSeverity] || 0;
      });

      // Clamp between 0 and 100
      // Note: Original score may have bonus points, but we're simplifying here
      return Math.max(0, Math.min(100, adjustedScore));
    },
    [preferences, getEffectiveSeverity]
  );

  return {
    preferences,
    isLoading,
    isLearning,
    getEffectiveSeverity,
    voteUp,
    voteDown,
    resetPreference,
    calculateAdjustedScore,
    hasPreference,
  };
}
