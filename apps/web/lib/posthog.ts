import posthog from 'posthog-js';

// Initialize PostHog
export function initPostHog() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  // Use custom proxy endpoint to avoid ad blockers
  // The proxy is at /api/posthog which forwards to PostHog's API
  const posthogHost = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/posthog`
    : process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      ui_host: 'https://us.i.posthog.com', // UI host remains the same
      person_profiles: 'identified_only', // Only create profiles for logged-in users
      capture_pageview: true, // Auto-capture page views
      capture_pageleave: true, // Track when users leave
      autocapture: true, // Auto-capture clicks, form submissions, etc.

      // Privacy settings
      mask_all_text: false, // Set to true if you want to mask all text
      mask_all_element_attributes: false,

      // Session recording (optional - remove if you don't want recordings)
      session_recording: {
        recordCrossOriginIframes: false,
      },
    });
  } else {
    console.warn('PostHog key not configured. Analytics disabled.');
  }
}

// Track custom events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties);
}

// Identify users (when they convert)
export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog.identify(userId, properties);
}

export default posthog;
