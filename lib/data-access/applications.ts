import {
  PROPERTY_COLUMNS,
  type SupabasePropertyRow,
  mapPropertyFromSupabaseRow
} from "@/lib/data-access/properties";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import { normalizeApplicationStatus } from "@/lib/application-status";
import type { ApplicationStatus, ApplicationSummary, UserRole } from "@/lib/types";

type SupabaseApplicationRow = {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  status: ApplicationStatus | null;
  submitted_at: string | null;
  reviewed_at?: string | null;
  decision_at?: string | null;
  property: SupabasePropertyRow | null;
  applicant: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type ListApplicationOptions = {
  statuses?: ApplicationStatus[];
};

const DEFAULT_APPLICATION_STATUSES: ApplicationStatus[] = [];

export async function listApplicationsForTenant(
  limit = 5,
  options: ListApplicationOptions = {}
): Promise<ApplicationSummary[]> {
  return listApplications("tenant", limit, options);
}

export async function listApplicationsForLandlord(
  limit = 5,
  options: ListApplicationOptions = {}
): Promise<ApplicationSummary[]> {
  return listApplications("landlord", limit, options);
}

async function listApplications(
  role: Exclude<UserRole, "guest">,
  limit: number,
  { statuses = DEFAULT_APPLICATION_STATUSES }: ListApplicationOptions
): Promise<ApplicationSummary[]> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return [];
  }

  const query = supabase
    .from("applications")
    .select(
      `
        id,
        property_id,
        tenant_id,
        landlord_id,
        status,
        submitted_at,
        reviewed_at,
        decision_at,
        property:properties (
          ${PROPERTY_COLUMNS}
        ),
        applicant:profiles!applications_tenant_id_fkey (
          full_name,
          email
        )
      `
    )
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (role === "tenant") {
    query.eq("tenant_id", user.id);
  } else {
    query.eq("properties.landlord_id", user.id);
  }

  if (statuses?.length) {
    const expandedStatuses = expandStatusesForQuery(statuses);
    query.in("status", expandedStatuses);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("[applications] Failed to load applications", error);
    return [];
  }

  return (data as unknown as SupabaseApplicationRow[]).map(mapApplicationFromSupabase);
}

function mapApplicationFromSupabase(row: SupabaseApplicationRow): ApplicationSummary {
  const property = row.property ? mapPropertyFromSupabaseRow(row.property) : null;
  const normalizedStatus = normalizeApplicationStatus(row.status);
  const summaryStatus = normalizedStatus as ApplicationStatus;
  return {
    id: row.id,
    propertyId: row.property_id,
    applicantId: row.tenant_id,
    applicantName:
      row.applicant?.full_name ??
      row.applicant?.email ??
      (row.tenant_id ? `Applicant ${row.tenant_id.slice(0, 4)}` : "Applicant"),
    propertyTitle: property?.title ?? "Property",
    status: summaryStatus,
    submittedAt: row.submitted_at ?? new Date().toISOString()
  };
}

function expandStatusesForQuery(statuses: ApplicationStatus[]): ApplicationStatus[] {
  const expanded = new Set<ApplicationStatus>();
  statuses.forEach((status) => {
    if (status === "accepted") {
      expanded.add("accepted");
      expanded.add("approved");
    } else {
      expanded.add(status);
    }
  });
  return Array.from(expanded);
}
