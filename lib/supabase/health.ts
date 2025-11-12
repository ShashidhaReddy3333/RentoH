import { env, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SupabaseHealthState = {
  hasEnv: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
};

export async function getSupabaseHealth(): Promise<SupabaseHealthState> {
  if (!hasSupabaseEnv) {
    return {
      hasEnv: false,
      connected: false,
      error: "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
    };
  }

  const client = createSupabaseServerClient(env.SUPABASE_SERVICE_ROLE_KEY ? "service" : "anon");
  if (!client) {
    return {
      hasEnv: true,
      connected: false,
      error: "Supabase client unavailable in this environment"
    };
  }

  const startedAt = Date.now();
  const { error } = await client
    .from("properties")
    .select("id", { count: "exact", head: true })
    .limit(1);
  const latencyMs = Date.now() - startedAt;

  if (error) {
    return {
      hasEnv: true,
      connected: false,
      latencyMs,
      error: error.message ?? "Unknown Supabase error"
    };
  }

  return {
    hasEnv: true,
    connected: true,
    latencyMs
  };
}
