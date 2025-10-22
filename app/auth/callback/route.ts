import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { event, session } = await request.json();

  if (
    event === "SIGNED_IN" ||
    event === "TOKEN_REFRESHED" ||
    event === "INITIAL_SESSION"
  ) {
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
    } else {
      await supabase.auth.signOut();
    }
  } else if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ success: true });
}
