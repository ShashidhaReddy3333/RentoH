import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { env, hasSupabaseEnv } from '@/lib/env';

type CookiePayload = { name: string; value: string; options: CookieOptions };

export function createSupabaseServerClient() {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are not configured.');
  }

  const cookieStore = cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }: CookiePayload) => {
          cookieStore.set({ name, value, ...options });
        });
      }
    }
  });
}
