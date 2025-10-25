import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const HEALTH_CHECK_TOKEN = process.env['HEALTH_CHECK_TOKEN'];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const isInternal = authHeader === `Bearer ${HEALTH_CHECK_TOKEN}`;
  
  const supabase = createSupabaseServerClient();
  let session = null;
  if (supabase && typeof supabase.auth?.getSession === 'function') {
    const resp = await supabase.auth.getSession();
  // resp may contain { data }
  session = resp?.data?.session ?? null;
  }

  // Basic health check for public access
  if (!isInternal) {
    return NextResponse.json({
      auth: {
        available: true,
        configured: Boolean(supabase)
      }
    });
  }

  // Detailed diagnostics for internal checks
  return NextResponse.json({
    auth: {
      available: true,
      configured: Boolean(supabase),
      session: Boolean(session),
      provider: "supabase"
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env['NEXT_PUBLIC_APP_VERSION'] || "dev",
      node_env: process.env.NODE_ENV
    }
  });
}
