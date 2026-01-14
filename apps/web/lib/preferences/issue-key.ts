/**
 * Utilities for generating stable issue keys and managing severity levels
 */

/**
 * Simple hash function for generating issue keys from messages
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get the issue key for an issue
 * @param issue - The issue object with optional ruleId and message
 * @returns A stable key for identifying this issue type
 */
export function getIssueKey(issue: { ruleId?: string; message: string }): string {
  if (issue.ruleId) {
    return issue.ruleId;
  }
  // For AI-discovered issues, hash the normalized message
  const normalizedMessage = issue.message.toLowerCase().trim();
  return `ai_${simpleHash(normalizedMessage)}`;
}

/**
 * Severity levels with their point deductions
 */
export const SEVERITY_POINTS: Record<string, number> = {
  critical: -10,
  moderate: -5,
  minor: -2,
  ignored: 0,
};

/**
 * Severity order for up/down navigation (most severe to least)
 */
export const SEVERITY_ORDER = ['critical', 'moderate', 'minor', 'ignored'] as const;
export type SeverityLevel = (typeof SEVERITY_ORDER)[number];

/**
 * Get the next severity level (down = less severe)
 */
export function getNextSeverity(current: string): string | null {
  const idx = SEVERITY_ORDER.indexOf(current as SeverityLevel);
  if (idx === -1 || idx >= SEVERITY_ORDER.length - 1) return null;
  return SEVERITY_ORDER[idx + 1];
}

/**
 * Get the previous severity level (up = more severe)
 */
export function getPrevSeverity(current: string): string | null {
  const idx = SEVERITY_ORDER.indexOf(current as SeverityLevel);
  if (idx <= 0) return null;
  return SEVERITY_ORDER[idx - 1];
}

/**
 * Get color classes for a severity level
 */
export function getSeverityColor(severity: string): {
  text: string;
  bg: string;
  border: string;
} {
  switch (severity) {
    case 'critical':
      return {
        text: 'text-red-500',
        bg: 'bg-red-500/5',
        border: 'border-red-500/20',
      };
    case 'moderate':
      return {
        text: 'text-orange-500',
        bg: 'bg-orange-500/5',
        border: 'border-orange-500/20',
      };
    case 'minor':
      return {
        text: 'text-blue-500',
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/20',
      };
    case 'ignored':
      return {
        text: 'text-gray-500',
        bg: 'bg-gray-500/5',
        border: 'border-gray-500/20',
      };
    default:
      return {
        text: 'text-gray-400',
        bg: 'bg-gray-500/5',
        border: 'border-gray-500/20',
      };
  }
}
