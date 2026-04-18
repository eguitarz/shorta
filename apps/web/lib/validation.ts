/**
 * Input validation — zero-dep replacement for the previous zod-based module.
 *
 * Keeps the original public API shape (`MAX_LENGTHS`, `MAX_ARRAY_SIZES`,
 * `ApiSchemas`, `validateRequestBody`, `validateQueryParams`) so existing
 * callers don't change. Only the internals are different: each "schema" is a
 * plain validator function `(data: unknown) => { ok: true, data } | { ok: false, message, field }`.
 *
 * Why we dropped zod: it contributed ~2 MB uncompressed / several hundred KB
 * compressed to the Cloudflare Workers bundle for a very small runtime
 * footprint (2 API routes + one form). Bundle size matters more than
 * validator ergonomics for this codebase.
 */

import { NextResponse } from 'next/server';

/** Maximum lengths for different input types */
export const MAX_LENGTHS = {
  URL: 2048,
  NICHE: 200,
  MESSAGE_CONTENT: 10000,
  TOPIC: 3000,
  FORMAT: 50,
  GENERAL_STRING: 1000,
};

/** Maximum array sizes */
export const MAX_ARRAY_SIZES = {
  MESSAGES: 50,
  TAGS: 20,
};

// ────────────────────────────────────────────────────────────────────────────
// Schema types
// ────────────────────────────────────────────────────────────────────────────

/** Success/failure shape for every schema. */
type SchemaResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; field: string };

/** A schema is a function that validates unknown input into a typed output. */
export type Schema<T> = (data: unknown, path?: string) => SchemaResult<T>;

// ────────────────────────────────────────────────────────────────────────────
// Low-level validators
// ────────────────────────────────────────────────────────────────────────────

function failAt(message: string, path: string): SchemaResult<never> {
  return { ok: false, message, field: path };
}

function okWith<T>(data: T): SchemaResult<T> {
  return { ok: true, data };
}

function str(
  opts: {
    min?: number;
    max?: number;
    minMessage?: string;
    maxMessage?: string;
    refine?: (v: string) => string | null; // return null = pass, string = error message
  } = {}
): Schema<string> {
  return (data, path = '') => {
    if (typeof data !== 'string') return failAt('Expected string', path);
    if (opts.min !== undefined && data.length < opts.min) {
      return failAt(opts.minMessage || `Must be at least ${opts.min} characters`, path);
    }
    if (opts.max !== undefined && data.length > opts.max) {
      return failAt(opts.maxMessage || `Must be less than ${opts.max} characters`, path);
    }
    if (opts.refine) {
      const err = opts.refine(data);
      if (err) return failAt(err, path);
    }
    return okWith(data);
  };
}

function num(opts: { min?: number; max?: number } = {}): Schema<number> {
  return (data, path = '') => {
    if (typeof data !== 'number' || Number.isNaN(data)) {
      return failAt('Expected number', path);
    }
    if (opts.min !== undefined && data < opts.min) {
      return failAt(`Must be >= ${opts.min}`, path);
    }
    if (opts.max !== undefined && data > opts.max) {
      return failAt(`Must be <= ${opts.max}`, path);
    }
    return okWith(data);
  };
}

function oneOf<T extends string>(...values: readonly T[]): Schema<T> {
  return (data, path = '') => {
    if (typeof data !== 'string' || !(values as readonly string[]).includes(data)) {
      return failAt(`Must be one of: ${values.join(', ')}`, path);
    }
    return okWith(data as T);
  };
}

function obj<T extends Record<string, Schema<any>>>(
  shape: T,
  opts: { refine?: (v: any) => string | null } = {}
): Schema<{ [K in keyof T]: T[K] extends Schema<infer U> ? U : never }> {
  return (data, path = '') => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return failAt('Expected object', path);
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      const childPath = path ? `${path}.${key}` : key;
      const result = shape[key]((data as Record<string, unknown>)[key], childPath);
      if (!result.ok) return result;
      out[key] = result.data;
    }
    if (opts.refine) {
      const err = opts.refine(out);
      if (err) return failAt(err, path);
    }
    return okWith(out as { [K in keyof T]: T[K] extends Schema<infer U> ? U : never });
  };
}

function arr<T>(item: Schema<T>, opts: { min?: number; max?: number; minMessage?: string; maxMessage?: string } = {}): Schema<T[]> {
  return (data, path = '') => {
    if (!Array.isArray(data)) return failAt('Expected array', path);
    if (opts.min !== undefined && data.length < opts.min) {
      return failAt(opts.minMessage || `Must have at least ${opts.min} item(s)`, path);
    }
    if (opts.max !== undefined && data.length > opts.max) {
      return failAt(opts.maxMessage || `Must have at most ${opts.max} item(s)`, path);
    }
    const out: T[] = [];
    for (let i = 0; i < data.length; i++) {
      const childPath = `${path}[${i}]`;
      const result = item(data[i], childPath);
      if (!result.ok) return result;
      out.push(result.data);
    }
    return okWith(out);
  };
}

function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return (data, path = '') => {
    if (data === undefined) return okWith(undefined);
    return schema(data, path);
  };
}

// Basic URL validator. We're not trying to match zod's full RFC parser, just
// catch obvious non-URLs. The routes that matter (YouTube URLs) have an
// additional regex refinement below.
function isValidUrl(s: string): boolean {
  try {
    // URL constructor is available in Workers runtime.
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public schemas (preserves original API surface)
// ────────────────────────────────────────────────────────────────────────────

export const urlSchema: Schema<string> = str({
  min: 1,
  max: MAX_LENGTHS.URL,
  minMessage: 'URL is required',
  maxMessage: `URL must be less than ${MAX_LENGTHS.URL} characters`,
  refine: (v) => (isValidUrl(v) ? null : 'Invalid URL format'),
});

export const youtubeUrlSchema: Schema<string> = str({
  min: 1,
  max: MAX_LENGTHS.URL,
  minMessage: 'URL is required',
  maxMessage: `URL must be less than ${MAX_LENGTHS.URL} characters`,
  refine: (v) => {
    if (!isValidUrl(v)) return 'Invalid URL format';
    if (!/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/.test(v)) {
      return 'URL must be a valid YouTube video URL';
    }
    return null;
  },
});

export const videoFormatSchema = oneOf('talking_head', 'gameplay', 'demo', 'other');

export const messageSchema = obj({
  role: oneOf('user', 'assistant', 'system'),
  content: str({
    min: 1,
    max: MAX_LENGTHS.MESSAGE_CONTENT,
    minMessage: 'Message content cannot be empty',
    maxMessage: `Message must be less than ${MAX_LENGTHS.MESSAGE_CONTENT} characters`,
  }),
});

export const messagesArraySchema = arr(messageSchema, {
  min: 1,
  max: MAX_ARRAY_SIZES.MESSAGES,
  minMessage: 'At least one message is required',
  maxMessage: `Maximum ${MAX_ARRAY_SIZES.MESSAGES} messages allowed`,
});

const nonWhitespaceString = (min: number, max: number, label: string): Schema<string> =>
  str({
    min,
    max,
    minMessage: `${label} is required`,
    maxMessage: `${label} must be less than ${max} characters`,
    refine: (v) => (v.trim().length > 0 ? null : `${label} cannot be only whitespace`),
  });

export const nicheSchema: Schema<string> = nonWhitespaceString(1, MAX_LENGTHS.NICHE, 'Niche');
export const topicSchema: Schema<string> = nonWhitespaceString(1, MAX_LENGTHS.TOPIC, 'Topic');

export const ApiSchemas = {
  analyzeVideo: obj({ url: urlSchema }),

  classifyVideo: obj({ url: youtubeUrlSchema }),

  lintVideo: obj({
    url: youtubeUrlSchema,
    format: videoFormatSchema,
  }),

  analyzeShort: obj({ url: urlSchema }),

  chat: obj({
    messages: messagesArraySchema,
    config: optional(
      obj({
        temperature: optional(num({ min: 0, max: 2 })),
        maxTokens: optional(num({ min: 1, max: 100000 })),
      })
    ),
  }),

  analyzeViralPatterns: obj({ niche: nicheSchema }),

  createStoryboard: obj({ topic: topicSchema }),

  generateStoryboard: obj({
    topic: topicSchema,
    format: optional(videoFormatSchema),
  }),

  youtubeStats: obj(
    {
      url: optional(urlSchema),
      videoId: optional(str({ min: 1, max: 20 })),
    },
    {
      refine: (v) =>
        v.url || v.videoId ? null : 'Either url or videoId must be provided',
    }
  ),
};

// ────────────────────────────────────────────────────────────────────────────
// Request body helpers (drop-in replacements for the previous zod versions)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Validate a request body against a schema. Returns { success: true, data }
 * on pass, or { success: false, error: NextResponse } on fail.
 */
export function validateRequestBody<T>(
  schema: Schema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema(data);
  if (result.ok) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: NextResponse.json(
      {
        error: 'Validation failed',
        message: result.message,
        field: result.field,
      },
      { status: 400 }
    ),
  };
}

/** Validate query parameters by coercing them into a plain object first. */
export function validateQueryParams<T>(
  schema: Schema<T>,
  params: URLSearchParams
): { success: true; data: T } | { success: false; error: NextResponse } {
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });
  return validateRequestBody(schema, data);
}
