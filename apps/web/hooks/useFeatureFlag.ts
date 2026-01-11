'use client';

import { useState, useEffect } from 'react';
import posthog from '@/lib/posthog';

/**
 * React hook to check if a PostHog feature flag is enabled
 * @param flagKey - Feature flag key (e.g., 'free-trial-enabled')
 * @returns boolean | null - true if enabled, false if disabled, null if loading
 *
 * @example
 * const freeTrialEnabled = useFeatureFlag('free-trial-enabled');
 * if (freeTrialEnabled === null) return <Loading />;
 * if (freeTrialEnabled) {
 *   // Show restricted UI
 * }
 */
export function useFeatureFlag(flagKey: string): boolean | null {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkFlag = () => {
      // Check if PostHog is loaded
      if (posthog && (posthog as any).__loaded) {
        const enabled = posthog.isFeatureEnabled(flagKey);
        if (mounted) {
          setIsEnabled(enabled || false);
        }
      } else {
        // Retry after PostHog loads
        setTimeout(checkFlag, 100);
      }
    };

    checkFlag();

    // Listen for feature flag updates
    // PostHog refreshes flags periodically
    const unsubscribe = posthog.onFeatureFlags?.(() => {
      if (mounted) {
        const enabled = posthog.isFeatureEnabled(flagKey);
        setIsEnabled(enabled || false);
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [flagKey]);

  return isEnabled;
}
