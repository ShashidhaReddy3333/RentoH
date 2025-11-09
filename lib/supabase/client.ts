"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient | null {
  const supabaseUrl = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[supabase] Browser client unavailable - add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase features."
      );
    }
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined;
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(c => c.startsWith(`${name}=`));
          return cookie?.substring(name.length + 1);
        },
        set(name: string, value: string, options: { maxAge?: number; path?: string }) {
          if (typeof document === 'undefined') return;
          let cookieString = `${name}=${value}`;
          if (options.path) cookieString += `; path=${options.path}`;
          if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
          cookieString += '; SameSite=Lax';
          document.cookie = cookieString;
        },
        remove(name: string, options: { path?: string }) {
          if (typeof document === 'undefined') return;
          let cookieString = `${name}=; max-age=0`;
          if (options.path) cookieString += `; path=${options.path}`;
          document.cookie = cookieString;
        }
      }
    });
  }

  return browserClient;
}
