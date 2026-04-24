import posthog from 'posthog-js';

/**
 * Valid PostHog project keys start with `phc_` (public) or `phx_` (server).
 * Anything else — empty, the literal placeholder "YOUR_POSTHOG_KEY", or a
 * typo — is treated as "not configured" and analytics is skipped entirely.
 * This prevents the client from shipping session-recording events to our
 * proxy when PostHog isn't set up, which was burning CF Worker CPU.
 */
function isValidPosthogKey(raw: string | undefined): raw is string {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed === 'YOUR_POSTHOG_KEY') return false;
  return /^ph[cx]_[A-Za-z0-9]/.test(trimmed);
}

let initialized = false;

// Initialize PostHog
export function initPostHog() {
  if (initialized) return;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!isValidPosthogKey(posthogKey)) {
    // No-op. Don't warn on every mount — it's expected in local/dev + when
    // PostHog is intentionally off.
    return;
  }
  const posthogHost =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/posthog`
      : process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  posthog.init(posthogKey, {
    api_host: posthogHost,
    ui_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,

    // Privacy settings
    mask_all_text: false,
    mask_all_element_attributes: false,

    // Session recording OFF by default. Session recordings were the main
    // source of CPU pressure on the proxy — each recording posts 100s of
    // KB of events. Leaving this disabled unless explicitly needed.
    disable_session_recording: true,
  });
  initialized = true;
}

function isReady(): boolean {
  return initialized && isValidPosthogKey(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

// Track custom events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!isReady()) return;
  posthog.capture(eventName, properties);
}

// Identify users (when they convert)
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!isReady()) return;
  posthog.identify(userId, properties);
}

export default posthog;
