/**
 * Server-side rate limiting utilities
 * Implements in-memory rate limiting for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
// In production, consider using Redis or Upstash for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Custom identifier key (defaults to IP address)
   */
  keyGenerator?: (request: NextRequest) => string;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Check common headers for real IP (when behind proxy/CDN)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection info
  return request.ip || 'unknown';
}

/**
 * Apply rate limiting to an API endpoint
 * Returns a NextResponse with 429 status if rate limit exceeded
 */
export function rateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, keyGenerator } = config;

  return (request: NextRequest): NextResponse | null => {
    const now = Date.now();
    const key = keyGenerator ? keyGenerator(request) : `ip:${getClientIp(request)}`;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    // Reset if window has passed
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count++;

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetAt.toString(),
          },
        }
      );
    }

    // Rate limit not exceeded
    return null;
  };
}

/**
 * Predefined rate limit configurations for different endpoint types
 */
export const RateLimits = {
  /**
   * For expensive AI-powered endpoints (10 requests per hour)
   */
  AI: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  /**
   * For authentication endpoints (5 attempts per 15 minutes)
   */
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  /**
   * For general API endpoints (100 requests per hour)
   */
  API: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  /**
   * For public endpoints like waitlist (10 requests per hour)
   */
  PUBLIC: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Rate limit middleware for authenticated users
 * Uses user ID instead of IP address for more accurate rate limiting
 */
export function rateLimitByUser(
  config: RateLimitConfig,
  userId: string
): NextResponse | null {
  const now = Date.now();
  const key = `user:${userId}`;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  // Reset if window has passed
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  // Check if rate limit exceeded
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `You have exceeded your rate limit. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetAt.toString(),
        },
      }
    );
  }

  // Rate limit not exceeded
  return null;
}
