import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["tenant", "landlord"])
});

export async function POST(request: Request) {
  const allowBypass = env.NODE_ENV !== "production" || env.BYPASS_SUPABASE_AUTH === "1";
  if (!allowBypass) {
    return NextResponse.json({ success: false, reason: "disabled" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, reason: "invalid-json" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, reason: "invalid-payload", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = createSupabaseServerClient("service");
  if (!supabase) {
    return NextResponse.json({ success: false, reason: "service-client-unavailable" }, { status: 500 });
  }

  const { userId, role } = parsed.data;

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
    app_metadata: { role }
  });

  if (updateError) {
    console.error("[confirm-email] failed to update user", updateError);
    return NextResponse.json({ success: false, reason: "update-failed" }, { status: 500 });
  }

  const { error: profileError } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (profileError) {
    console.warn("[confirm-email] failed to sync profile role", profileError);
  }

  return NextResponse.json({ success: true });
}
