import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { getSupabaseHealth } from "@/lib/supabase/health";

export async function GET() {
  try {
    const health = await getSupabaseHealth();
    const status = !health.hasEnv || !health.connected ? 503 : 200;
    return NextResponse.json(health, { status });
  } catch (error) {
    console.error("[api/health/db] Unexpected error", error);
    return NextResponse.json(
      { hasEnv: false, connected: false, error: "Unable to evaluate Supabase health" },
      { status: 500 }
    );
  }
}
