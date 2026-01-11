'use client';

import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

/**
 * Cloudflare Turnstile CAPTCHA Widget
 * https://developers.cloudflare.com/turnstile/
 *
 * Privacy-focused CAPTCHA alternative with invisible verification
 */
export function TurnstileWidget({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'dark',
  size = 'normal',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (containerRef.current && (window as any).turnstile) {
        try {
          // Render widget
          widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size,
            callback: (token: string) => {
              console.log('[Turnstile] Verification successful');
              onVerify(token);
            },
            'error-callback': () => {
              console.error('[Turnstile] Verification error');
              onError?.();
            },
            'expired-callback': () => {
              console.warn('[Turnstile] Token expired');
              onExpire?.();
            },
          });
        } catch (error) {
          console.error('[Turnstile] Failed to render widget:', error);
          onError?.();
        }
      }
    };

    script.onerror = () => {
      console.error('[Turnstile] Failed to load script');
      onError?.();
    };

    // Cleanup
    return () => {
      if (widgetIdRef.current && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('[Turnstile] Failed to remove widget:', error);
        }
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [siteKey, onVerify, onError, onExpire, theme, size]);

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center min-h-[65px]"
    />
  );
}

// Type declaration for TypeScript
declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}
