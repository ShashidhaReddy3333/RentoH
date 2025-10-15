import { NextResponse } from "next/server";

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export async function GET() {
  const missing = required.filter((key) => !process.env[key]);
  const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"];
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    siteUrl,
    supabaseUrl,
  });
}
