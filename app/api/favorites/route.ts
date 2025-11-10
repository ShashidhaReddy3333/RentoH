import { NextResponse } from "next/server";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function extractMessage(obj: unknown): string | undefined {
  if (!obj) return undefined;
  if (typeof obj === "string") return obj;
  if (typeof obj === "object" && obj !== null) {
    const rec = obj as Record<string, unknown>;
    const m = rec["message"];
    if (typeof m === "string") return m;
  }
  return undefined;
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const propertyId = body?.propertyId;
  if (!propertyId || typeof propertyId !== "string") {
    return NextResponse.json({ error: "Missing or invalid propertyId" }, { status: 400 });
  }

  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = checkRateLimit(user.id, RATE_LIMITS.favorites);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.favorites.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        }
      }
    );
  }

  try {
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId });
    if (error) {
      // allow idempotency for duplicates
      if ((error as { code?: string })?.code === "23505") {
        return NextResponse.json({ ok: true });
      }
      console.error("[api/favorites] insert error", error);
      const msg = extractMessage(error) ?? "Failed to save favorite";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    console.error("[api/favorites] POST error", err);
    const msg = extractMessage(err) ?? "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = await readJson(request);
  const propertyId = body?.propertyId;
  if (!propertyId || typeof propertyId !== "string") {
    return NextResponse.json({ error: "Missing or invalid propertyId" }, { status: 400 });
  }

  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = checkRateLimit(user.id, RATE_LIMITS.favorites);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.favorites.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        }
      }
    );
  }

  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", propertyId);

    if (error) {
      console.error("[api/favorites] delete error", error);
      const msg = extractMessage(error) ?? "Failed to remove favorite";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[api/favorites] DELETE error", err);
    const msg = extractMessage(err) ?? "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
