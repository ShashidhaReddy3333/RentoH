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

export async function addFavorite(propertyId: string): Promise<boolean> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, property_id: propertyId });

  if (error) {
    console.error("[favorites] Failed to add favorite", error);
    throw error;
  }

  return true;
}

export async function removeFavorite(propertyId: string): Promise<boolean> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("property_id", propertyId);

  if (error) {
    console.error("[favorites] Failed to remove favorite", error);
    throw error;
  }

  return true;
}