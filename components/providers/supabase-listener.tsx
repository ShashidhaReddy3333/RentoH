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

      if (!csrf) return;

      // Keep the Next.js server session in sync by posting to our callback route.
      await fetch(CALLBACK_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ event, session, csrf })
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
