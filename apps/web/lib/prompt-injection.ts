/**
 * Prompt injection detection utilities
 * Helps prevent attackers from manipulating LLM behavior
 */

/**
 * Common prompt injection patterns
 */
const INJECTION_PATTERNS = [
  // System override attempts
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|commands?)/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|commands?)/gi,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|commands?)/gi,

  // Role manipulation
  /you\s+are\s+(now\s+)?a\s+(helpful\s+)?(hacker|attacker|jailbreak)/gi,
  /you\s+are\s+(now\s+)?in\s+(developer|admin|root|debug)\s+mode/gi,
  /act\s+as\s+(a\s+)?(hacker|attacker|DAN|evil)/gi,
  /pretend\s+(you\s+are|to\s+be)\s+(a\s+)?(hacker|attacker)/gi,

  // Instruction injection
  /new\s+(instructions?|prompts?|commands?):/gi,
  /system\s+(message|prompt|instruction):/gi,
  /assistant\s+rules:/gi,

  // Data exfiltration attempts
  /show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules)/gi,
  /what\s+(are|were)\s+(your|the)\s+(original|initial|system)\s+(instructions?|prompts?)/gi,
  /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions?)/gi,

  // Escape attempts
  /```[\s\S]*system[\s\S]*```/gi,
  /<\|im_start\|>system/gi,
  /<\|im_end\|>/gi,
  /\[SYSTEM\]/gi,
  /\[\/INST\]/gi,

  // Common jailbreak phrases
  /do anything now/gi,
  /DAN mode/gi,
  /jailbreak/gi,

  // Instruction termination attempts
  /---END OF INSTRUCTIONS?---/gi,
  /STOP READING INSTRUCTIONS?/gi,
];

/**
 * Suspicious character sequences
 */
const SUSPICIOUS_SEQUENCES = [
  '\x00', // Null byte
  '\ufffd', // Replacement character
  '\\x00', // Escaped null
];

/**
 * Maximum allowed consecutive special characters
 */
const MAX_CONSECUTIVE_SPECIAL = 10;

/**
 * Detects potential prompt injection attempts
 * @param input - User input to check
 * @returns Object with detection result and details
 */
export function detectPromptInjection(input: string): {
  detected: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
} {
  if (!input || typeof input !== 'string') {
    return { detected: false };
  }

  // Check for known injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        detected: true,
        reason: `Detected prompt injection pattern: ${pattern.source}`,
        severity: 'high',
      };
    }
  }

  // Check for suspicious character sequences
  for (const seq of SUSPICIOUS_SEQUENCES) {
    if (input.includes(seq)) {
      return {
        detected: true,
        reason: `Detected suspicious character sequence`,
        severity: 'medium',
      };
    }
  }

  // Check for excessive special characters
  const specialCharMatches = input.match(/[^\w\s]/g);
  if (specialCharMatches && specialCharMatches.length > input.length * 0.3) {
    return {
      detected: true,
      reason: 'Excessive special characters detected',
      severity: 'low',
    };
  }

  // Check for consecutive special characters
  const consecutiveSpecial = input.match(/[^\w\s]{10,}/g);
  if (consecutiveSpecial && consecutiveSpecial.length > 0) {
    return {
      detected: true,
      reason: 'Excessive consecutive special characters detected',
      severity: 'medium',
    };
  }

  // Check for multiple system-like tags
  const systemTagPattern = /<\/?[a-z]+>/gi;
  const systemTags = input.match(systemTagPattern);
  if (systemTags && systemTags.length > 5) {
    return {
      detected: true,
      reason: 'Multiple system-like tags detected',
      severity: 'low',
    };
  }

  return { detected: false };
}

/**
 * Sanitizes user input for safe use with LLMs
 * Removes or escapes potentially dangerous content
 * @param input - User input to sanitize
 * @returns Sanitized input
 */
export function sanitizeForLLM(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove null bytes and replacement characters
  sanitized = sanitized.replace(/\x00/g, '');
  sanitized = sanitized.replace(/\ufffd/g, '');

  // Remove common escape sequences
  sanitized = sanitized.replace(/\\x00/g, '');

  // Limit consecutive special characters
  sanitized = sanitized.replace(/([^\w\s])\1{9,}/g, '$1$1$1');

  // Remove potential system tags
  sanitized = sanitized.replace(/<\|im_start\|>/gi, '');
  sanitized = sanitized.replace(/<\|im_end\|>/gi, '');
  sanitized = sanitized.replace(/\[SYSTEM\]/gi, '');
  sanitized = sanitized.replace(/\[\/INST\]/gi, '');

  // Trim to reasonable length (already handled by Zod, but double-check)
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized.trim();
}

/**
 * Validates that user input is safe for LLM processing
 * Combines detection and sanitization
 * @param input - User input to validate
 * @param options - Validation options
 * @returns Validation result with sanitized input or error
 */
export function validateLLMInput(
  input: string,
  options: {
    allowHighSeverity?: boolean;
    allowMediumSeverity?: boolean;
  } = {}
): { valid: true; sanitized: string } | { valid: false; reason: string } {
  const { allowHighSeverity = false, allowMediumSeverity = false } = options;

  // Detect injection attempts
  const detection = detectPromptInjection(input);

  if (detection.detected) {
    // Block high severity by default
    if (detection.severity === 'high' && !allowHighSeverity) {
      return {
        valid: false,
        reason: 'Input contains suspicious patterns that could manipulate AI behavior',
      };
    }

    // Block medium severity by default
    if (detection.severity === 'medium' && !allowMediumSeverity) {
      return {
        valid: false,
        reason: 'Input contains suspicious patterns',
      };
    }
  }

  // Sanitize the input
  const sanitized = sanitizeForLLM(input);

  return { valid: true, sanitized };
}
