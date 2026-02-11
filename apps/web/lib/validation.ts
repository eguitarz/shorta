/**
 * Input validation schemas and utilities
 * Uses Zod for runtime type checking and validation
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Maximum lengths for different input types
 */
export const MAX_LENGTHS = {
  URL: 2048,
  NICHE: 200,
  MESSAGE_CONTENT: 10000,
  TOPIC: 3000,
  FORMAT: 50,
  GENERAL_STRING: 1000,
};

/**
 * Maximum array sizes
 */
export const MAX_ARRAY_SIZES = {
  MESSAGES: 50,
  TAGS: 20,
};

/**
 * URL validation schema
 */
export const urlSchema = z.string()
  .min(1, 'URL is required')
  .max(MAX_LENGTHS.URL, `URL must be less than ${MAX_LENGTHS.URL} characters`)
  .url('Invalid URL format');

/**
 * YouTube URL validation schema
 */
export const youtubeUrlSchema = z.string()
  .min(1, 'URL is required')
  .max(MAX_LENGTHS.URL, `URL must be less than ${MAX_LENGTHS.URL} characters`)
  .url('Invalid URL format')
  .refine(
    (url) => /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/.test(url),
    'URL must be a valid YouTube video URL'
  );

/**
 * Video format validation schema
 */
export const videoFormatSchema = z.enum(['talking_head', 'gameplay', 'demo', 'other']);

/**
 * Message schema for chat endpoints
 */
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(MAX_LENGTHS.MESSAGE_CONTENT, `Message must be less than ${MAX_LENGTHS.MESSAGE_CONTENT} characters`),
});

/**
 * Messages array schema
 */
export const messagesArraySchema = z.array(messageSchema)
  .min(1, 'At least one message is required')
  .max(MAX_ARRAY_SIZES.MESSAGES, `Maximum ${MAX_ARRAY_SIZES.MESSAGES} messages allowed`);

/**
 * Niche/topic validation schema
 */
export const nicheSchema = z.string()
  .min(1, 'Niche is required')
  .max(MAX_LENGTHS.NICHE, `Niche must be less than ${MAX_LENGTHS.NICHE} characters`)
  .refine(
    (niche) => niche.trim().length > 0,
    'Niche cannot be only whitespace'
  );

/**
 * Topic validation schema
 */
export const topicSchema = z.string()
  .min(1, 'Topic is required')
  .max(MAX_LENGTHS.TOPIC, `Topic must be less than ${MAX_LENGTHS.TOPIC} characters`)
  .refine(
    (topic) => topic.trim().length > 0,
    'Topic cannot be only whitespace'
  );

/**
 * API request schemas for different endpoints
 */
export const ApiSchemas = {
  analyzeVideo: z.object({
    url: urlSchema,
  }),

  classifyVideo: z.object({
    url: youtubeUrlSchema,
  }),

  lintVideo: z.object({
    url: youtubeUrlSchema,
    format: videoFormatSchema,
  }),

  analyzeShort: z.object({
    url: urlSchema,
  }),

  chat: z.object({
    messages: messagesArraySchema,
    config: z.object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(100000).optional(),
    }).optional(),
  }),

  analyzeViralPatterns: z.object({
    niche: nicheSchema,
  }),

  createStoryboard: z.object({
    topic: topicSchema,
  }),

  generateStoryboard: z.object({
    topic: topicSchema,
    format: videoFormatSchema.optional(),
  }),

  youtubeStats: z.object({
    url: urlSchema.optional(),
    videoId: z.string().min(1).max(20).optional(),
  }).refine(
    (data) => data.url || data.videoId,
    'Either url or videoId must be provided'
  ),
};

/**
 * Validate request body against a schema
 * Returns validated data or error response
 */
export function validateRequestBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            message: firstError.message,
            field: firstError.path.join('.'),
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T extends z.ZodType>(
  schema: T,
  params: URLSearchParams
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });

  return validateRequestBody(schema, data);
}
