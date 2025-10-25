import { NextResponse } from "next/server";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
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

  try {
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId });
    if (error) {
      // allow idempotency for duplicates
      if ((error as any)?.code === "23505") {
        return NextResponse.json({ ok: true });
      }
      console.error("[api/favorites] insert error", error);
      return NextResponse.json({ error: error.message ?? "Failed to save favorite" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    console.error("[api/favorites] POST error", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
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

  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", propertyId);

    if (error) {
      console.error("[api/favorites] delete error", error);
      return NextResponse.json({ error: error.message ?? "Failed to remove favorite" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/favorites] DELETE error", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
