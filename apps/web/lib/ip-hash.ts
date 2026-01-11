import { NextRequest } from 'next/server';

/**
 * Hash an IP address with salt for GDPR-compliant anonymous tracking
 * Uses SHA-256 with a server-side salt to create a one-way hash
 * The original IP cannot be reverse-engineered from the hash
 *
 * @param ip - The IP address to hash
 * @returns Promise<string> - Hexadecimal hash string
 */
export async function hashIP(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-me-in-production';

  if (salt === 'default-salt-change-me-in-production') {
    console.warn(
      '[Security Warning] IP_HASH_SALT not set. Using default salt. ' +
      'Set IP_HASH_SALT via: wrangler secret put IP_HASH_SALT'
    );
  }

  // Combine IP with salt
  const data = ip + salt;

  // Use Web Crypto API (available in Cloudflare Workers and Node.js 15+)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Create SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Extract client IP address from request headers
 * Prioritizes Cloudflare's CF-Connecting-IP header
 *
 * @param request - NextRequest object
 * @returns string - Client IP address
 */
export function getClientIp(request: NextRequest): string {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  // This is the most reliable source when deployed on Cloudflare Workers
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to X-Forwarded-For (proxy chains)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // We want the first one (original client IP)
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  // Fallback to X-Real-IP
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback to request.ip (if available)
  if (request.ip) {
    return request.ip;
  }

  // Last resort: return unknown
  console.warn('[IP Detection] Could not determine client IP address');
  return 'unknown';
}

/**
 * Check if an IP address is likely a VPN or proxy
 * This is a basic check and not foolproof
 * @param ip - IP address to check
 * @returns boolean - true if likely a VPN/proxy
 */
export function isLikelyVpn(ip: string): boolean {
  // Basic checks for common VPN/proxy patterns
  // This is not exhaustive and can have false positives/negatives

  // Check for localhost/private IPs (should never reach here, but defensive)
  if (
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.')
  ) {
    return false; // Private IPs, not VPNs
  }

  // In production, you could integrate with services like:
  // - IPQualityScore
  // - MaxMind GeoIP2
  // - ProxyCheck.io
  // For now, we'll return false (assume not VPN)
  return false;
}

/**
 * Get geographic information from IP (if available)
 * Cloudflare adds geo headers automatically
 */
export function getIpGeo(request: NextRequest): {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
} {
  return {
    country: request.headers.get('cf-ipcountry') || undefined,
    city: request.headers.get('cf-ipcity') || undefined,
    region: request.headers.get('cf-region') || undefined,
    timezone: request.headers.get('cf-timezone') || undefined,
  };
}
