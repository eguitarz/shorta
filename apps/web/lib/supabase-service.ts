import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service role privileges.
 * This client bypasses Row Level Security (RLS) policies.
 *
 * Use this ONLY in server-side code that needs to:
 * - Update jobs from background processes
 * - Access data across all users
 * - Perform admin operations
 *
 * NEVER expose this client to the frontend or use in client components.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY secret. ' +
      'Set it using: npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
