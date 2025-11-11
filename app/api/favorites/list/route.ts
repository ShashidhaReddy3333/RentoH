import { NextResponse } from "next/server";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";

export async function GET() {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        property_id,
        properties:property_id (
          id,
          title,
          address,
          city,
          price,
          beds,
          baths,
          images,
          slug,
          type,
          verified,
          pets,
          furnished,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/favorites/list] Error:", error);
      return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
    }

    // Transform the data to flatten the structure
    const favorites = (data || [])
      .map((item: { properties: unknown }) => {
        const property = Array.isArray(item.properties) ? item.properties[0] : item.properties;
        return property;
      })
      .filter(Boolean)
      .map((property: {
        id: string;
        title: string;
        address: string;
        city: string;
        price: number;
        beds: number;
        baths: number;
        images: string[];
        slug: string;
        type: "apartment" | "house" | "condo" | "townhouse";
        verified: boolean;
        pets: boolean;
        furnished: boolean;
        created_at: string;
      }) => ({
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        price: property.price,
        beds: property.beds,
        baths: property.baths,
        images: property.images,
        slug: property.slug,
        type: property.type,
        verified: property.verified,
        pets: property.pets,
        furnished: property.furnished,
        createdAt: property.created_at,
        isFavorite: true
      }));

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error("[api/favorites/list] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
