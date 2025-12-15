import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Support both new publishable key (sb_publishable_...) and legacy anon key
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
	supabase = createClient(supabaseUrl, supabaseKey);
} else if (import.meta.env.DEV) {
	console.warn('Supabase environment variables not configured. Waitlist feature will not work.');
}

export { supabase };

