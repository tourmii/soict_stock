import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase client will be null if credentials are not configured
export const supabase =
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = () => supabase !== null;
