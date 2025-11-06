import { PROPERTY_COLUMNS, type SupabasePropertyRow, mapPropertyFromSupabaseRow } from "@/lib/data-access/properties";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import type { ApplicationStatus, ApplicationSummary, UserRole } from "@/lib/types";

type SupabaseApplicationRow = {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  status: ApplicationStatus | null;
  submitted_at: string | null;
  property: SupabasePropertyRow | null;
  applicant: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export async function listApplicationsForTenant(limit = 5): Promise<ApplicationSummary[]> {
  return listApplications("tenant", limit);
}

export async function listApplicationsForLandlord(limit = 5): Promise<ApplicationSummary[]> {
  return listApplications("landlord", limit);
}

async function listApplications(role: Exclude<UserRole, "guest">, limit: number): Promise<ApplicationSummary[]> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return [];
  }

  const column = role === "tenant" ? "tenant_id" : "landlord_id";
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
        id,
        property_id,
        tenant_id,
        landlord_id,
        status,
        submitted_at,
        property:properties (
          ${PROPERTY_COLUMNS}
        ),
        applicant:profiles!applications_tenant_id_fkey (
          full_name,
          email
        )
      `
    )
    .eq(column, user.id)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[applications] Failed to load applications", error);
    return [];
  }

  return (data as unknown as SupabaseApplicationRow[]).map(mapApplicationFromSupabase);
}

function mapApplicationFromSupabase(row: SupabaseApplicationRow): ApplicationSummary {
  const property = row.property ? mapPropertyFromSupabaseRow(row.property) : null;
  return {
    id: row.id,
    propertyId: row.property_id,
    applicantId: row.tenant_id,
    applicantName:
      row.applicant?.full_name ??
      row.applicant?.email ??
      (row.tenant_id ? `Applicant ${row.tenant_id.slice(0, 4)}` : "Applicant"),
    propertyTitle: property?.title ?? "Property",
    status: row.status ?? "submitted",
    submittedAt: row.submitted_at ?? new Date().toISOString()
  };
}

