import { createClient } from '@supabase/supabase-js';

import { env, hasSupabaseEnv } from '@/lib/env';

export function supabaseServer() {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
