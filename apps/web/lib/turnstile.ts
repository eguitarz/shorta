/**
 * Cloudflare Turnstile verification
 * https://developers.cloudflare.com/turnstile/
 *
 * Turnstile is Cloudflare's CAPTCHA alternative:
 * - Privacy-focused (no tracking)
 * - Often invisible verification
 * - Free tier available
 * - Better UX than reCAPTCHA
 */

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Cloudflare Turnstile token
 *
 * @param token - Token from Turnstile widget
 * @param remoteip - Client IP address (optional but recommended)
 * @returns Promise<boolean> - true if verification succeeds
 */
export async function verifyTurnstile(
  token: string,
  remoteip?: string
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('[Turnstile] TURNSTILE_SECRET_KEY not configured');
    console.error('[Turnstile] Set it with: wrangler secret put TURNSTILE_SECRET_KEY');
    // In development, you might want to bypass verification
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Turnstile] Bypassing verification in development mode');
      return true;
    }
    return false;
  }

  if (!token) {
    console.error('[Turnstile] No token provided');
    return false;
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip, // Optional but recommended
        }),
      }
    );

    if (!response.ok) {
      console.error(`[Turnstile] HTTP error: ${response.status}`);
      return false;
    }

    const data: TurnstileResponse = await response.json();

    if (!data.success) {
      console.warn('[Turnstile] Verification failed:', data['error-codes']);
      return false;
    }

    console.log('[Turnstile] Verification successful');
    return true;
  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    return false;
  }
}

/**
 * Get detailed verification result with error codes
 * Use this if you need more information than just success/failure
 */
export async function verifyTurnstileDetailed(
  token: string,
  remoteip?: string
): Promise<TurnstileResponse> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return {
      success: false,
      'error-codes': ['missing-secret-key'],
    };
  }

  if (!token) {
    return {
      success: false,
      'error-codes': ['missing-input-response'],
    };
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip,
        }),
      }
    );

    const data: TurnstileResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    return {
      success: false,
      'error-codes': ['internal-error'],
    };
  }
}

/**
 * Error code explanations
 * https://developers.cloudflare.com/turnstile/troubleshooting/
 */
export const TURNSTILE_ERROR_CODES: Record<string, string> = {
  'missing-input-secret': 'The secret parameter was not passed',
  'invalid-input-secret': 'The secret parameter was invalid or did not exist',
  'missing-input-response': 'The response parameter (token) was not passed',
  'invalid-input-response': 'The response parameter (token) is invalid or has expired',
  'bad-request': 'The request was rejected because it was malformed',
  'timeout-or-duplicate': 'The response parameter has already been validated before',
  'internal-error': 'An internal error happened while validating the response',
  'missing-secret-key': 'TURNSTILE_SECRET_KEY environment variable not set',
};

/**
 * Get human-readable error message
 */
export function getTurnstileErrorMessage(errorCodes?: string[]): string {
  if (!errorCodes || errorCodes.length === 0) {
    return 'Verification failed';
  }

  const messages = errorCodes
    .map(code => TURNSTILE_ERROR_CODES[code] || code)
    .join(', ');

  return `Verification failed: ${messages}`;
}
