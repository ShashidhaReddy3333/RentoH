import { NextResponse } from "next/server";

import { clientEnv } from "@/lib/env";

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

export async function GET() {
  const missing = required.filter((key) => !clientEnv[key]);

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    siteUrl: clientEnv.NEXT_PUBLIC_SITE_URL ?? null,
    supabaseUrl: clientEnv.NEXT_PUBLIC_SUPABASE_URL ?? null
  });
}
