/**
 * Secure error handling utilities
 * Prevents information disclosure while maintaining useful debugging
 */

import { NextResponse } from 'next/server';

/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  // Client errors (4xx)
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  LLM_ERROR = 'LLM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
}

/**
 * Safe error messages that don't leak system information
 */
const SAFE_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_INPUT]: 'Invalid request data',
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.RATE_LIMIT]: 'Rate limit exceeded',
  [ErrorCode.PAYLOAD_TOO_LARGE]: 'Request payload too large',
  [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.LLM_ERROR]: 'AI processing failed',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_API_ERROR]: 'External service error',
};

/**
 * HTTP status codes for error types
 */
const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RATE_LIMIT]: 429,
  [ErrorCode.PAYLOAD_TOO_LARGE]: 413,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.LLM_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
};

/**
 * Creates a safe error response
 * Logs detailed error server-side, returns safe message to client
 */
export function createErrorResponse(
  error: unknown,
  errorCode: ErrorCode,
  context?: string
): NextResponse {
  // Log detailed error server-side for debugging
  console.error(`[${errorCode}] ${context || 'API Error'}:`, {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    } : error,
    timestamp: new Date().toISOString(),
  });

  // Return safe error to client
  const response = {
    error: SAFE_ERROR_MESSAGES[errorCode],
    code: errorCode,
    // Only include timestamp, no other sensitive info
    timestamp: new Date().toISOString(),
  };

  // In development, include more details
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    (response as any).details = {
      message: error.message,
      stack: error.stack,
    };
  }

  return NextResponse.json(response, {
    status: ERROR_STATUS_CODES[errorCode],
  });
}

/**
 * Wraps an async API handler with error handling
 * Catches all errors and returns safe error responses
 */
export function withErrorHandler<T>(
  handler: () => Promise<T>,
  context?: string
): Promise<T | NextResponse> {
  return handler().catch((error) => {
    // Determine error type
    let errorCode = ErrorCode.INTERNAL_ERROR;

    if (error?.message?.includes('fetch')) {
      errorCode = ErrorCode.EXTERNAL_API_ERROR;
    } else if (error?.message?.includes('database') || error?.message?.includes('supabase')) {
      errorCode = ErrorCode.DATABASE_ERROR;
    } else if (error?.message?.includes('LLM') || error?.message?.includes('Gemini')) {
      errorCode = ErrorCode.LLM_ERROR;
    }

    return createErrorResponse(error, errorCode, context);
  });
}

/**
 * Request size configuration
 */
export const REQUEST_SIZE_LIMITS = {
  // Maximum body size in bytes (1MB)
  MAX_BODY_SIZE: 1024 * 1024,
  // Maximum JSON depth
  MAX_JSON_DEPTH: 10,
};

/**
 * Validates request body size
 */
export async function validateRequestSize(request: Request): Promise<{
  valid: boolean;
  error?: NextResponse;
}> {
  try {
    // Check Content-Length header
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > REQUEST_SIZE_LIMITS.MAX_BODY_SIZE) {
        return {
          valid: false,
          error: createErrorResponse(
            new Error('Request body too large'),
            ErrorCode.PAYLOAD_TOO_LARGE
          ),
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: createErrorResponse(error, ErrorCode.INVALID_INPUT),
    };
  }
}

/**
 * Validates JSON depth to prevent stack overflow
 */
export function validateJsonDepth(obj: any, maxDepth = REQUEST_SIZE_LIMITS.MAX_JSON_DEPTH): boolean {
  function checkDepth(value: any, currentDepth: number): boolean {
    if (currentDepth > maxDepth) {
      return false;
    }

    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.every(item => checkDepth(item, currentDepth + 1));
      } else {
        return Object.values(value).every(val => checkDepth(val, currentDepth + 1));
      }
    }

    return true;
  }

  return checkDepth(obj, 1);
}

/**
 * Safe JSON parse with size and depth validation
 */
export async function safeParseJSON<T = any>(
  request: Request
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  // Validate request size
  const sizeValidation = await validateRequestSize(request);
  if (!sizeValidation.valid) {
    return { success: false, error: sizeValidation.error! };
  }

  try {
    const text = await request.text();

    // Check text size
    if (text.length > REQUEST_SIZE_LIMITS.MAX_BODY_SIZE) {
      return {
        success: false,
        error: createErrorResponse(
          new Error('Request body too large'),
          ErrorCode.PAYLOAD_TOO_LARGE
        ),
      };
    }

    // Parse JSON
    const data = JSON.parse(text);

    // Validate depth
    if (!validateJsonDepth(data)) {
      return {
        success: false,
        error: createErrorResponse(
          new Error('JSON structure too deep'),
          ErrorCode.INVALID_INPUT
        ),
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: createErrorResponse(
        error,
        ErrorCode.INVALID_INPUT,
        'JSON parsing failed'
      ),
    };
  }
}
