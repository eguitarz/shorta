# Environment Variables Security Documentation

## Public vs Private Environment Variables

This document explains which environment variables are intentionally exposed to the client-side and why.

### ✅ Public Environment Variables (Safe to Expose)

These variables are prefixed with `NEXT_PUBLIC_` and are **intentionally** exposed to the browser. They are embedded in the client-side JavaScript bundle.

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Purpose**: Supabase project URL for client-side authentication
- **Safe because**: This is a public URL that identifies your Supabase project
- **Not sensitive**: Cannot be used to access data without proper authentication

#### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Purpose**: Supabase anonymous/public API key
- **Safe because**: This is the "anon" key designed to be public
- **Protected by**: Row Level Security (RLS) policies in Supabase
- **Not sensitive**: Cannot bypass RLS policies; requires proper authentication

#### `NEXT_PUBLIC_POSTHOG_KEY`
- **Purpose**: PostHog analytics project key
- **Safe because**: This key is designed to be public for client-side analytics
- **Not sensitive**: Only allows sending analytics events, not reading data

#### `NEXT_PUBLIC_POSTHOG_HOST`
- **Purpose**: PostHog server URL
- **Safe because**: This is a public endpoint URL
- **Not sensitive**: Just the server address

#### `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
- **Purpose**: Public Stripe payment link URL
- **Safe because**: This is a public URL for payments
- **Not sensitive**: Anyone can visit this URL to make payments

#### `NEXT_PUBLIC_APP_URL`
- **Purpose**: Application base URL (optional)
- **Safe because**: This is your public website URL
- **Not sensitive**: Publicly accessible

---

### 🔒 Private Environment Variables (NEVER Expose)

These variables are **server-side only** and must NEVER be prefixed with `NEXT_PUBLIC_`.

#### `GEMINI_API_KEY`
- **Purpose**: Google Gemini AI API key
- **CRITICAL**: Server-side only
- **Risk if exposed**: Unauthorized AI API usage, cost escalation
- **Protected by**: Not prefixed with NEXT_PUBLIC_

#### `YOUTUBE_API_KEY`
- **Purpose**: YouTube Data API key
- **CRITICAL**: Server-side only
- **Risk if exposed**: Quota abuse, unauthorized data access
- **Protected by**: Not prefixed with NEXT_PUBLIC_

#### `LLM_MODEL`
- **Purpose**: Default LLM model configuration
- **Server-side only**: Model selection is controlled server-side
- **Not sensitive but**: Should not be exposed to prevent inference of capabilities

---

## Security Checklist

Before deploying, verify:

- [ ] All secret API keys are NOT prefixed with `NEXT_PUBLIC_`
- [ ] `GEMINI_API_KEY` is server-side only
- [ ] `YOUTUBE_API_KEY` is server-side only
- [ ] Supabase RLS policies are enabled and tested
- [ ] PostHog key is the public/project key, not the personal API key
- [ ] `.env.local` is in `.gitignore`
- [ ] Production environment variables are set in deployment platform

---

## Testing Environment Variable Exposure

To verify which variables are exposed client-side:

1. Build the application: `npm run build`
2. Search the build output for sensitive keys: `grep -r "GEMINI_API_KEY" .next/`
3. If found in `.next/static/`, the key is exposed (CRITICAL BUG!)
4. Public keys should only appear in `.next/server/` (server-side)

---

## How Next.js Handles Environment Variables

### Client-Side (Browser)
- Only variables prefixed with `NEXT_PUBLIC_` are bundled
- These are embedded in JavaScript and visible to anyone
- Available in both server and client components
- Example: `process.env.NEXT_PUBLIC_SUPABASE_URL`

### Server-Side (Node.js)
- All environment variables are available
- Never sent to the browser
- Only available in Server Components, API Routes, and server-side code
- Example: `process.env.GEMINI_API_KEY`

---

## Supabase Security Model

The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is safe to expose because:

1. **Row Level Security (RLS)**: All database access is protected by RLS policies
2. **Authentication Required**: Most operations require a valid user session
3. **Anon Key Limitations**: The public key has minimal permissions
4. **Service Role Key**: The powerful key is server-side only

**Important**: Always enable and test RLS policies! Without RLS, the public key could be misused.

---

## References

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Client Keys](https://supabase.com/docs/guides/api/api-keys)
- [PostHog Client SDK](https://posthog.com/docs/libraries/js)

---

## Rotation Schedule

Recommended API key rotation schedule:

- **Supabase Keys**: Rotate annually or after any security incident
- **Gemini API Key**: Rotate quarterly
- **YouTube API Key**: Rotate quarterly
- **PostHog Key**: No rotation needed (project-specific)

---

**Last Updated**: 2026-01-04
**Reviewed By**: Security Audit - Claude AI
