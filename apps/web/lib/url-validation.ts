/**
 * URL validation utilities to prevent SSRF attacks
 */

// Private IP ranges to block (RFC 1918, loopback, link-local, etc.)
const BLOCKED_IP_PATTERNS = [
  /^127\./,              // Loopback
  /^10\./,               // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
  /^192\.168\./,         // Private Class C
  /^169\.254\./,         // Link-local
  /^::1$/,               // IPv6 loopback
  /^fe80:/,              // IPv6 link-local
  /^fc00:/,              // IPv6 unique local
  /^fd00:/,              // IPv6 unique local
  /^localhost$/i,        // Localhost hostname
];

// Cloud metadata endpoints to block
const BLOCKED_HOSTNAMES = [
  'metadata.google.internal',
  '169.254.169.254',           // AWS, Azure, GCP metadata
  'metadata',
  'metadata.azure.com',
  'instance-data',
];

// Allowed domains for video analysis endpoints
const ALLOWED_VIDEO_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
];

/**
 * Validates a URL to prevent SSRF attacks
 * @param urlString - The URL to validate
 * @param options - Validation options
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateUrl(
  urlString: string,
  options: {
    allowedDomains?: string[];
    blockPrivateIPs?: boolean;
    blockCloudMetadata?: boolean;
  } = {}
): { isValid: boolean; error?: string } {
  const {
    allowedDomains,
    blockPrivateIPs = true,
    blockCloudMetadata = true,
  } = options;

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // Only allow HTTP/HTTPS protocols
  if (!['http:', 'https:'].includes(url.protocol)) {
    return {
      isValid: false,
      error: `Protocol "${url.protocol}" is not allowed. Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostname = url.hostname.toLowerCase();

  // Check against allowed domains if specified
  if (allowedDomains && allowedDomains.length > 0) {
    const isAllowed = allowedDomains.some((domain) => {
      const domainLower = domain.toLowerCase();
      return (
        hostname === domainLower || hostname.endsWith(`.${domainLower}`)
      );
    });

    if (!isAllowed) {
      return {
        isValid: false,
        error: `Domain "${hostname}" is not in the allowlist. Only ${allowedDomains.join(', ')} are allowed.`,
      };
    }
  }

  // Block cloud metadata endpoints
  if (blockCloudMetadata) {
    if (BLOCKED_HOSTNAMES.some((blocked) => hostname.includes(blocked))) {
      return {
        isValid: false,
        error: 'Access to cloud metadata endpoints is not allowed',
      };
    }
  }

  // Block private IP addresses
  if (blockPrivateIPs) {
    // Check if hostname is an IP address
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const isIPv6 = hostname.includes(':') && !hostname.includes('.');

    if (isIPv4 || isIPv6) {
      for (const pattern of BLOCKED_IP_PATTERNS) {
        if (pattern.test(hostname)) {
          return {
            isValid: false,
            error: 'Access to private IP addresses is not allowed',
          };
        }
      }
    }

    // Also check for localhost and other blocked hostnames
    if (BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
      return {
        isValid: false,
        error: 'Access to local/private addresses is not allowed',
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates a YouTube URL specifically
 * @param urlString - The URL to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateYouTubeUrl(urlString: string): {
  isValid: boolean;
  error?: string;
} {
  const result = validateUrl(urlString, {
    allowedDomains: ALLOWED_VIDEO_DOMAINS,
    blockPrivateIPs: true,
    blockCloudMetadata: true,
  });

  if (!result.isValid) {
    return result;
  }

  // Additional YouTube-specific validation
  const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/;
  if (!youtubeRegex.test(urlString)) {
    return {
      isValid: false,
      error: 'URL must be a valid YouTube video URL (youtube.com/watch, youtube.com/shorts, or youtu.be)',
    };
  }

  return { isValid: true };
}

/**
 * Validates a URL and only allows safe external URLs for content fetching
 * Blocks private IPs, cloud metadata, and file:// protocols
 * @param urlString - The URL to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateExternalUrl(urlString: string): {
  isValid: boolean;
  error?: string;
} {
  return validateUrl(urlString, {
    blockPrivateIPs: true,
    blockCloudMetadata: true,
  });
}
