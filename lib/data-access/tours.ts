import { PROPERTY_COLUMNS, type SupabasePropertyRow, mapPropertyFromSupabaseRow } from "@/lib/data-access/properties";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import type { Tour, TourStatus, UserRole } from "@/lib/types";

type SupabaseTourRow = {
  id: string;
  property_id: string;
  status: TourStatus | null;
  scheduled_at: string | null;
  timezone?: string | null;
  property: SupabasePropertyRow | null;
  landlord_id: string;
  tenant_id: string;
  notes?: string | null;
};

export async function listUpcomingToursForTenant(limit = 3): Promise<Tour[]> {
  return listUpcomingTours("tenant", limit);
}

export async function listUpcomingToursForLandlord(limit = 3): Promise<Tour[]> {
  return listUpcomingTours("landlord", limit);
}

async function listUpcomingTours(role: Exclude<UserRole, "guest">, limit: number): Promise<Tour[]> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return [];
  }

  const column = role === "tenant" ? "tenant_id" : "landlord_id";
  const { data, error } = await supabase
    .from("tours")
    .select(
      `
        id,
        property_id,
        status,
        scheduled_at,
        timezone,
        landlord_id,
        tenant_id,
        property:properties (
          ${PROPERTY_COLUMNS}
        )
      `
    )
    .eq(column, user.id)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error("[tours] Failed to load tours", error);
    return [];
  }

  return (data as unknown as SupabaseTourRow[]).map(mapTourFromSupabase);
}

function mapTourFromSupabase(row: SupabaseTourRow): Tour {
  const property = row.property ? mapPropertyFromSupabaseRow(row.property) : null;
  return {
    id: row.id,
    propertyId: row.property_id,
    propertyTitle: property?.title ?? "Property",
     propertySlug: property?.slug,
     propertyImage: property?.images?.[0] ?? null,
    scheduledAt: row.scheduled_at ?? new Date().toISOString(),
     timezone: row.timezone ?? undefined,
    city: property?.city,
    status: row.status ?? "requested",
    landlordId: row.landlord_id,
    tenantId: row.tenant_id,
    notes: row.notes ?? undefined
  };
}
