import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support both new publishable key (sb_publishable_...) and legacy anon key
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
	supabase = createClient(supabaseUrl, supabaseKey);
} else if (process.env.NODE_ENV === 'development') {
	console.warn('Supabase environment variables not configured. Waitlist feature will not work.');
}

export { supabase };

