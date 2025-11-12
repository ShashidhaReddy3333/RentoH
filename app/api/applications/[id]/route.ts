import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

function extractMessage(obj: unknown): string | undefined {
  if (!obj) return undefined;
  if (typeof obj === "string") return obj;
  if (typeof obj === "object" && obj !== null) {
    const rec = obj as Record<string, unknown>;
    const m = rec["message"] ?? rec["error"]; 
    if (typeof m === "string") return m;
  }
  return undefined;
}

type PatchBody = { status?: string };

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = (body as PatchBody);
  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const allowedStatuses = new Set(["submitted", "reviewing", "interview", "approved", "rejected"]);
  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(user.id, RATE_LIMITS.applications);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": RATE_LIMITS.applications.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rate.resetAt.toString()
        }
      }
    );
  }

  const { data: appRow, error: fetchErr } = await supabase
    .from("applications")
    .select("id, status, tenant_id, landlord_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !appRow) {
    const msg = extractMessage(fetchErr) ?? "Application not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  if (appRow.landlord_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentStatus: string = appRow.status ?? "submitted";
  const transitions: Record<string, string[]> = {
    submitted: ["reviewing", "approved", "rejected"],
    reviewing: ["interview", "approved", "rejected"],
    interview: ["approved", "rejected"]
  };
  const allowedNext = transitions[currentStatus] ?? [];
  if (!allowedNext.includes(status)) {
    return NextResponse.json({ error: `Invalid status transition from ${currentStatus} to ${status}` }, { status: 400 });
  }

  const { error: updErr } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);

  if (updErr) {
    const msg = extractMessage(updErr) ?? "Failed to update application";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true, status });
}
