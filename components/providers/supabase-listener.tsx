"use client";

import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";

const CALLBACK_ENDPOINT = "/auth/callback";

export function SupabaseListener() {
  const supabase = hasSupabaseEnv ? createSupabaseBrowserClient() : null;

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!event) return;

      const csrf = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("rento_csrf="))
        ?.split("=")[1];

      if (!csrf) {
        console.warn("[auth] Missing CSRF token. Skipping auth state sync.");
        return;
      }

      // Keep the Next.js server session in sync by posting to our callback route.
      try {
        await fetch(CALLBACK_ENDPOINT, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ event, session, csrf })
        });
      } catch (error) {
        console.error("[auth] Failed to sync auth state", error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
