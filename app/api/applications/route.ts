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

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const propertyId = body?.propertyId as string | undefined;
  const message = body?.message as string | undefined;
  const monthlyIncomeRaw = body?.monthlyIncome;
  const monthlyIncome = typeof monthlyIncomeRaw === "number" ? monthlyIncomeRaw : Number.parseInt(String(monthlyIncomeRaw ?? ""), 10);

  if (!propertyId || !Number.isFinite(monthlyIncome)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

  const { data, error } = await supabase
    .from("applications")
    .insert({
      property_id: propertyId,
      landlord_id: property.landlord_id,
      tenant_id: user.id,
      monthly_income: monthlyIncome,
      message: message ?? null,
      status: "submitted",
      submitted_at: new Date().toISOString()
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    const msg = extractMessage(error) ?? "Failed to submit application";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${data.id}`);
  revalidatePath("/dashboard");

  return NextResponse.json({ application: { id: data.id } }, { status: 201 });
}
