import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSupabaseClientWithUser(): Promise<{
  supabase: ReturnType<typeof createSupabaseServerClient>;
  user: User | null;
}> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { supabase: null, user: null };
  }

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("[supabase] Failed to fetch session", sessionError);
  }

  if (session?.user) {
    return { supabase, user: session.user };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("[supabase] Unable to resolve current user", error);
    return { supabase, user: null };
  }

  return { supabase, user: data.user ?? null };
}

