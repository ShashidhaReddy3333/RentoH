"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function sendEmailOtp(email: string) {
  const supabase = createClientComponentClient();
  const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"];

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
