import { PROPERTY_COLUMNS, mapPropertyFromSupabaseRow, type SupabasePropertyRow } from "@/lib/data-access/properties";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import type { Property } from "@/lib/types";

type SupabaseFavoriteRow = {
  created_at: string | null;
  property: SupabasePropertyRow | null;
};

export async function listFavoriteProperties(limit = 12): Promise<Property[]> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("favorites")
    .select(
      `
        created_at,
        property:properties (
          ${PROPERTY_COLUMNS}
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[favorites] Failed to load favorites", error);
    return [];
  }

  return (data as unknown as SupabaseFavoriteRow[])
    .map((row) => row.property)
    .filter((property): property is SupabasePropertyRow => property != null)
    .map((property) => mapPropertyFromSupabaseRow(property));
}