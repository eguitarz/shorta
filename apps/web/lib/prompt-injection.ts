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

/**
 * Patterns that indicate off-topic questions
 * These questions are not related to video content creation
 */
const OFF_TOPIC_PATTERNS = [
  // Questions about the AI itself
  /what\s+(model|llm|ai|gpt|gemini|claude)\s+(are\s+you|do\s+you\s+use)/gi,
  /which\s+(model|llm|ai)\s+(are\s+you|is\s+this)/gi,
  /are\s+you\s+(gpt|gemini|claude|chatgpt|llama)/gi,
  /what\s+are\s+you\s+(made|built|trained|based)\s+(of|on|with)/gi,
  /who\s+(made|created|built|trained)\s+you/gi,
  /what\s+(is|are)\s+your\s+(context|training|knowledge|capabilities)/gi,
  /how\s+(were|are)\s+you\s+(trained|built|made)/gi,
  /what\s+version\s+(are\s+you|of\s+ai)/gi,

  // Security probing
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions?|rules|guidelines)/gi,
  /show\s+(me\s+)?(the\s+)?(your\s+)?(system\s+)?(context|prompt|instructions)/gi,
  /print\s+(your\s+)?(system\s+)?(prompt|instructions|context)/gi,
  /repeat\s+(your\s+)?(system\s+)?(prompt|instructions|context)/gi,
  /what\s+were\s+you\s+told/gi,

  // General knowledge questions (not video-related)
  /what\s+is\s+the\s+(capital|population|president|prime\s+minister)\s+of/gi,
  /who\s+(is|was)\s+the\s+(president|king|queen|prime\s+minister|ceo)/gi,
  /when\s+(did|was|is)\s+.{3,50}\s+(born|die|founded|start|happen)/gi,
  /tell\s+me\s+about\s+(history|science|math|geography|politics)/gi,
  /explain\s+(what|how)\s+(is|does|are)\s+.{3,50}\s+(work|mean)/gi,
  /what\s+is\s+the\s+(meaning|definition)\s+of/gi,
  /solve\s+this\s+(math|equation|problem)/gi,
  /calculate\s+(\d|what)/gi,

  // Fun/personal questions
  /tell\s+me\s+a\s+(joke|story|riddle)/gi,
  /let'?s\s+play\s+a\s+game/gi,
  /can\s+you\s+(sing|rap|write\s+a\s+poem|write\s+poetry)/gi,
  /what\s+(is|are)\s+your\s+(favorite|opinion|thoughts\s+on)/gi,
  /do\s+you\s+(like|love|hate|prefer)/gi,
  /how\s+do\s+you\s+feel/gi,
  /are\s+you\s+(sentient|conscious|alive|real)/gi,

  // Code/programming unrelated to video
  /write\s+(me\s+)?(a\s+)?(python|javascript|code|program|script)\s+(to|that|for)/gi,
  /debug\s+this\s+(code|program|script)/gi,
  /fix\s+this\s+(code|bug|error)/gi,

  // Other off-topic requests
  /translate\s+.{3,50}\s+(to|into)\s+(spanish|french|german|chinese|japanese)/gi,
  /summarize\s+this\s+(article|document|text|book)/gi,
  /help\s+me\s+with\s+(my\s+)?(homework|essay|assignment)/gi,
  /write\s+(me\s+)?(a\s+)?(essay|letter|email|resume)/gi,
];

/**
 * Keywords that indicate video content creation context
 */
const VIDEO_CONTENT_KEYWORDS = [
  'video', 'storyboard', 'script', 'hook', 'viral', 'shorts', 'tiktok',
  'youtube', 'content', 'creator', 'edit', 'beat', 'scene', 'shot',
  'thumbnail', 'title', 'description', 'niche', 'audience', 'format',
  'engagement', 'retention', 'views', 'analytics', 'performance',
  'b-roll', 'talking head', 'tutorial', 'vlog', 'intro', 'outro',
  'transition', 'cta', 'call to action', 'library', 'analysis',
  'generate', 'create', 'make', 'improve', 'optimize'
];

/**
 * Validates that user input is relevant to video content creation
 * @param input - User input to check
 * @returns Object with relevance result and reason
 */
export function validateTopicRelevance(input: string): {
  isRelevant: boolean;
  reason?: string;
} {
  if (!input || typeof input !== 'string') {
    return { isRelevant: true }; // Empty input is handled elsewhere
  }

  const lowerInput = input.toLowerCase();

  // Check if input contains video-related keywords
  const hasVideoContext = VIDEO_CONTENT_KEYWORDS.some(keyword =>
    lowerInput.includes(keyword.toLowerCase())
  );

  // Check for off-topic patterns
  for (const pattern of OFF_TOPIC_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      // If it has video context, allow it (e.g., "what model works best for video hooks")
      if (!hasVideoContext) {
        return {
          isRelevant: false,
          reason: 'off_topic_question',
        };
      }
    }
  }

  return { isRelevant: true };
}

/**
 * Standard refusal message for off-topic queries
 */
export const SHORTA_AI_REFUSAL_MESSAGE = `Hi! I'm Shorta AI, your video content creation assistant. 🎬

I'm here to help you with:
• Creating viral video storyboards and scripts
• Analyzing your video content performance
• Generating engaging hooks and titles
• Optimizing your shorts for better engagement

Is there anything related to your video content I can help with?`;
