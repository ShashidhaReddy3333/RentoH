'use client';

import { createBrowserClient } from '@supabase/ssr';

import { clientEnv } from '@/lib/env';

export function createSupabaseBrowserClient() {
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL || !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase public environment variables are not configured.');
  }

  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: true, autoRefreshToken: true }
    }
  );
}
