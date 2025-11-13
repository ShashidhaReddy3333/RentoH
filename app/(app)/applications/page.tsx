import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { default as ApplicationsClient } from '@/app/(app)/applications/ApplicationsClient';
import { normalizeApplicationStatus } from '@/lib/application-status';
import { resolveImageUrls } from '@/lib/data-access/properties';

const FALLBACK_PROPERTY_IMAGE = "/images/listings/home-1.jpg";

export default async function ApplicationsPage() {
  const supabase = createSupabaseServerClient();
  
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      tenant_id,
      landlord_id,
      property_id,
      status,
      message,
      notes,
      monthly_income,
      timeline,
      submitted_at,
      created_at,
      updated_at,
      property:properties(
        id,
        title,
        address,
        images,
        price
      ),
      applicant:profiles!applications_tenant_id_fkey(
        full_name,
        email,
        avatar_url
      ),
      landlord:profiles!applications_landlord_id_fkey(
        full_name,
        email,
        avatar_url
      )
    `)
    .order('submitted_at', { ascending: false });

  type ApplicationsClientProps = React.ComponentProps<typeof ApplicationsClient>;
  type RawProfile = {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };

  type RawProperty = {
    id: string | null;
    title: string | null;
    address: string | null;
    images: (string | null)[] | null;
    price: number | null;
  };

  type RawTimelineEntry = {
    status?: string;
    timestamp?: string;
    note?: string;
  };

  type RawApplicationRow = {
    id: string;
    status: string | null;
    submitted_at: string | null;
    created_at: string | null;
    message: string | null;
    monthly_income: number | null;
    notes: string | null;
    timeline: RawTimelineEntry[] | null;
    property: RawProperty | RawProperty[] | null;
    applicant: RawProfile | RawProfile[] | null;
    landlord: RawProfile | RawProfile[] | null;
  };

  function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
      return value.length > 0 ? value[0] ?? null : null;
    }
    return value ?? null;
  }

  const normalizedApplications: ApplicationsClientProps["applications"] = (applications ?? []).map((applicationRow: unknown) => {
    const application = applicationRow as RawApplicationRow;
    const propertyRecord = firstOrNull(application.property);
    const applicantRecord = firstOrNull(application.applicant);
    const landlordRecord = firstOrNull(application.landlord);

    const propertyImages =
      propertyRecord?.images?.filter((image): image is string => typeof image === 'string' && image.length > 0) ?? [];
    const images =
      propertyImages.length > 0 ? resolveImageUrls(propertyImages) : [FALLBACK_PROPERTY_IMAGE];
    const timelineSource = Array.isArray(application.timeline) ? application.timeline : [];
    const timeline = timelineSource.map((entry) => ({
      status: entry?.status ? normalizeApplicationStatus(entry.status) : "updated",
      timestamp: entry?.timestamp ?? new Date().toISOString(),
      note: entry?.note ?? ""
    }));

    const normalizedStatus = normalizeApplicationStatus(application.status ?? 'submitted');

    return {
      id: application.id,
      status: normalizedStatus,
      submitted_at: application.submitted_at ?? application.created_at ?? new Date().toISOString(),
      message: application.message ?? "",
      monthly_income: application.monthly_income ?? 0,
      notes: application.notes ?? "",
      timeline,
      property: {
        id: propertyRecord?.id ?? "",
        title: propertyRecord?.title ?? "Property",
        address: propertyRecord?.address ?? "",
        images,
        price: propertyRecord?.price ?? 0
      },
      applicant: {
        full_name: applicantRecord?.full_name ?? "",
        email: applicantRecord?.email ?? "",
        avatar_url: applicantRecord?.avatar_url ?? ""
      },
      landlord: {
        full_name: landlordRecord?.full_name ?? "",
        email: landlordRecord?.email ?? "",
        avatar_url: landlordRecord?.avatar_url ?? ""
      }
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <ApplicationsClient applications={normalizedApplications} userRole={session.user.role || 'tenant'} />
    </div>
  );
}
