import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anon);

// Untyped client. We cast row types in the repo layer; keeps Supabase generics
// (which can change between versions) out of the rest of the codebase.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
