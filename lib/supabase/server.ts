import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Creates a Supabase server client with cookie-based session management.
 *
 * @param role - The role to use for authentication:
 *   - "anon" (default): Uses the public anon key for user-scoped operations
 *   - "service": Uses the service role key for admin or elevated operations
 *
 * @returns A Supabase client instance or null if credentials are missing.
 */
export function createSupabaseServerClient(role: "anon" | "service" = "anon"): SupabaseClient | null {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    role === "service" ? env.SUPABASE_SERVICE_ROLE_KEY : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV !== "test") {
      const missingKey = role === "service" ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY";
      console.warn(
        `[supabase] Server client unavailable - missing NEXT_PUBLIC_SUPABASE_URL or ${missingKey}.`
      );
    }
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component where setting cookies is unsupported.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Called from a Server Component where setting cookies is unsupported.
        }
      }
    }
  });
}
