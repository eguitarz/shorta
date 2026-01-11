import { PostHog } from 'posthog-node';

let posthogServer: PostHog | null = null;

/**
 * Get or create server-side PostHog client for feature flag checks
 * Used in API routes and server components
 */
export function getPostHogServer(): PostHog {
  if (!posthogServer) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!key) {
      throw new Error('NEXT_PUBLIC_POSTHOG_KEY is not configured');
    }

    posthogServer = new PostHog(key, {
      host,
      // Personal API key for advanced features (optional)
      personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
    });
  }

  return posthogServer;
}

/**
 * Check if a feature flag is enabled for a specific user/IP
 * @param flagKey - Feature flag key (e.g., 'free-trial-enabled')
 * @param distinctId - User ID or hashed IP address
 * @returns Promise<boolean> - Whether the flag is enabled
 */
export async function isFeatureEnabled(
  flagKey: string,
  distinctId: string
): Promise<boolean> {
  try {
    const posthog = getPostHogServer();
    const isEnabled = await posthog.isFeatureEnabled(flagKey, distinctId);

    // Default to false if flag doesn't exist or errors
    return isEnabled || false;
  } catch (error) {
    console.error(`[PostHog] Error checking feature flag "${flagKey}":`, error);
    // Fail closed - return false on error to maintain existing behavior
    return false;
  }
}

/**
 * Get all feature flags for a user
 * Useful for debugging and checking multiple flags at once
 */
export async function getAllFeatureFlags(
  distinctId: string
): Promise<Record<string, boolean | string>> {
  try {
    const posthog = getPostHogServer();
    const flags = await posthog.getAllFlags(distinctId);
    return flags || {};
  } catch (error) {
    console.error(`[PostHog] Error getting feature flags:`, error);
    return {};
  }
}

/**
 * Shutdown PostHog client (call on process exit)
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogServer) {
    await posthogServer.shutdown();
    posthogServer = null;
  }
}

// Graceful shutdown on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (posthogServer) {
      // Synchronous shutdown for exit event
      posthogServer.shutdown();
    }
  });

  // Handle other termination signals
  process.on('SIGINT', async () => {
    await shutdownPostHog();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await shutdownPostHog();
    process.exit(0);
  });
}
