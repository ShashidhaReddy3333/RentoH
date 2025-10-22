"use client";

import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CALLBACK_ENDPOINT = "/auth/callback";

export function SupabaseListener() {
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!event) return;

      // Keep the Next.js server session in sync by posting to our callback route.
      await fetch(CALLBACK_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ event, session })
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
