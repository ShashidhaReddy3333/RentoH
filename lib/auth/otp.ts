"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { clientEnv } from "@/lib/env";

export async function sendEmailOtp(email: string) {
  const supabase = createSupabaseBrowserClient();
  
  if (!supabase) {
    throw new Error("Supabase client not available");
  }
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    console.error("[OTP] config missing", {
      message: "NEXT_PUBLIC_SITE_URL is not set",
      siteUrl,
    });
    throw new Error("Configuration error. Please try again later.");
  }

  const redirectTo = `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    console.error("[OTP] send failed", {
      message: error.message,
      name: error.name,
      status: error.status,
      code: (error as unknown as { code?: string })?.code,
      redirectTo,
      siteUrl,
    });
    throw new Error(error.message || "Failed to send OTP");
  }

  return data;
}
