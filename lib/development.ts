/**
 * Development-only utilities to ensure proper configuration and
 * prevent production usage of development-only features.
 */

import { env } from "./env";

/**
 * Check if we are in a development or test environment.
 * This is used to gate mock data and development-only features.
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === "development" || env.NODE_ENV === "test";
}

/**
 * Warn about missing Supabase configuration in development.
 * In production, this will throw an error to prevent mock data usage.
 */
export function warnAboutMissingSupabase(context: string): void {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isDevelopment()) {
      console.warn(
        `[${context}] Supabase environment variables missing. Using mock data. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local`
      );
    } else {
      throw new Error(
        `[${context}] Supabase configuration required in production. Check environment variables.`
      );
    }
  }
}