import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { hasSupabaseEnv } from "@/lib/env";

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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec = (body ?? {}) as Record<string, unknown>;
  const propertyId = typeof rec["propertyId"] === "string" ? (rec["propertyId"] as string) : undefined;
  const message = typeof rec["message"] === "string" ? (rec["message"] as string) : undefined;
  const monthlyIncomeRaw = rec["monthlyIncome"];
  const monthlyIncome = typeof monthlyIncomeRaw === "number" ? monthlyIncomeRaw : Number.parseInt(String(monthlyIncomeRaw ?? ""), 10);

  if (!propertyId || !Number.isFinite(monthlyIncome)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!hasSupabaseEnv) {
    console.info("[applications] Supabase unavailable; returning demo application response.");
    return NextResponse.json(
      {
        application: {
          id: `demo-application-${Date.now().toString(36)}`,
          status: "submitted"
        },
        preview: true
      },
      { status: 201 }
    );
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

  // Lookup property to determine landlord
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("id, landlord_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (propErr || !property) {
    const msg = extractMessage(propErr) ?? "Property not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  const payloadBase: Record<string, unknown> = {
    property_id: propertyId,
    landlord_id: property.landlord_id,
    tenant_id: user.id,
    monthly_income: Number.isFinite(monthlyIncome) ? monthlyIncome : null,
    status: "submitted",
    submitted_at: new Date().toISOString()
  };
  if (typeof message === "string" && message.length > 0) {
    payloadBase["message"] = message;
  }

  // Non-null client for subsequent operations (we have already returned when supabase is null)
  const client = supabase!;

  async function tryInsert(payload: Record<string, unknown>) {
    return client
      .from("applications")
      .insert(payload)
      .select("id")
      .maybeSingle();
  }

  let insertResult = await tryInsert(payloadBase);

  if (insertResult.error) {
    const errMsg = String(insertResult.error.message ?? "");
    const needsRetry =
      insertResult.error.code === "42703" ||
      /column\s+"?(message|submitted_at|monthly_income)"?/i.test(errMsg);

    if (needsRetry) {
      const fallback: Record<string, unknown> = { ...payloadBase };
      if (/message/i.test(errMsg)) delete fallback["message"];
      if (/submitted_at/i.test(errMsg)) delete fallback["submitted_at"];
      if (/monthly_income/i.test(errMsg)) delete fallback["monthly_income"];
      insertResult = await tryInsert(fallback);
    }
  }

  const { data, error } = insertResult;
  if (error || !data) {
    const msg = extractMessage(error) ?? "Failed to submit application";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${data.id}`);
  revalidatePath("/dashboard");

  return NextResponse.json({ application: { id: data.id } }, { status: 201 });
}
