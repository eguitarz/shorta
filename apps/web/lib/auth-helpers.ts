import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByUser, RateLimits } from './rate-limit';

/**
 * Verifies that the request comes from an authenticated user.
 * Returns the user object if authenticated, or null if not.
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // API route - ignore cookie setting errors
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Validates CSRF protection by checking Origin and Referer headers.
 * Prevents cross-site request forgery attacks.
 */
export function validateCsrf(request: NextRequest): {
  isValid: boolean;
  error?: string;
} {
  // Only check for state-changing methods
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { isValid: true };
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Allow requests from same origin
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  // Check Origin header (preferred)
  if (origin) {
    const isAllowed = allowedOrigins.some((allowed) => origin === allowed);
    if (!isAllowed) {
      return {
        isValid: false,
        error: `CSRF validation failed: Origin '${origin}' not allowed`,
      };
    }
    return { isValid: true };
  }

  // Fallback to Referer header
  if (referer) {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    const isAllowed = allowedOrigins.some((allowed) => refererOrigin === allowed);
    if (!isAllowed) {
      return {
        isValid: false,
        error: `CSRF validation failed: Referer '${refererOrigin}' not allowed`,
      };
    }
    return { isValid: true };
  }

  // No Origin or Referer header for state-changing request
  return {
    isValid: false,
    error: 'CSRF validation failed: Missing Origin and Referer headers',
  };
}

/**
 * Middleware helper to require authentication for API routes.
 * Returns an error response if not authenticated, otherwise returns null.
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Combined authentication and CSRF protection for API routes.
 * Use this for all state-changing endpoints (POST, PUT, DELETE, PATCH).
 */
export async function requireAuthWithCsrf(request: NextRequest) {
  // Check CSRF first (faster check)
  const csrfResult = validateCsrf(request);
  if (!csrfResult.isValid) {
    return NextResponse.json(
      { error: csrfResult.error || 'CSRF validation failed' },
      { status: 403 }
    );
  }

  // Then check authentication
  return requireAuth(request);
}

/**
 * Combined authentication, CSRF protection, and rate limiting for API routes.
 * Use this for expensive AI-powered endpoints.
 */
export async function requireAuthWithCsrfAndRateLimit(request: NextRequest) {
  // Check CSRF first (faster check)
  const csrfResult = validateCsrf(request);
  if (!csrfResult.isValid) {
    return NextResponse.json(
      { error: csrfResult.error || 'CSRF validation failed' },
      { status: 403 }
    );
  }

  // Check authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  // Apply rate limiting based on user ID
  const rateLimitError = rateLimitByUser(RateLimits.AI, user.id);
  if (rateLimitError) {
    return rateLimitError;
  }

  return null;
}
