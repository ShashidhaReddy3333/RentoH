import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { default as ToursClient } from '@/app/(app)/tours/ToursClient';
import { getCurrentUser } from '@/lib/data-access/profile';

export default async function ToursPage() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/sign-in');
  }

  // Fetch tour slots and booked tours
  const { data: tours } = await supabase
    .from('tours')
    .select(`
      id,
      status,
      scheduled_at,
      notes,
      property_id,
      landlord_id,
      tenant_id,
      property:properties(
        id,
        title,
        address,
        images
      ),
      landlord:profiles!tours_landlord_id_fkey(
        full_name,
        email,
        avatar_url
      ),
      tenant:profiles!tours_tenant_id_fkey(
        full_name,
        email,
        avatar_url
      )
    `)
    .or(`tenant_id.eq.${currentUser.id},landlord_id.eq.${currentUser.id}`)
    .order('scheduled_at', { ascending: true });

  type ToursClientProps = React.ComponentProps<typeof ToursClient>;
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
  };

  type RawTourRow = {
    id: string;
    status: string | null;
    scheduled_at: string | null;
    notes: string | null;
    property: RawProperty | RawProperty[] | null;
    landlord: RawProfile | RawProfile[] | null;
    tenant: RawProfile | RawProfile[] | null;
  };

  function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
      return value.length > 0 ? value[0] ?? null : null;
    }
    return value ?? null;
  }

  const normalizedTours: ToursClientProps['tours'] = (tours ?? []).map((tourRow: unknown) => {
    const tour = tourRow as RawTourRow;
    const propertyRecord = firstOrNull(tour.property);
    const landlordRecord = firstOrNull(tour.landlord);
    const tenantRecord = firstOrNull(tour.tenant);

    const propertyImages = propertyRecord?.images?.filter((image): image is string => typeof image === 'string') ?? [];

    return {
      id: tour.id,
      status: tour.status ?? 'requested',
      scheduled_at: tour.scheduled_at ?? new Date().toISOString(),
      notes: tour.notes ?? '',
      property: {
        id: propertyRecord?.id ?? '',
        title: propertyRecord?.title ?? 'Property',
        address: propertyRecord?.address ?? '',
        images: propertyImages.length > 0 ? propertyImages : ['']
      },
      landlord: {
        full_name: landlordRecord?.full_name ?? '',
        email: landlordRecord?.email ?? '',
        avatar_url: landlordRecord?.avatar_url ?? ''
      },
      tenant: {
        full_name: tenantRecord?.full_name ?? '',
        email: tenantRecord?.email ?? '',
        avatar_url: tenantRecord?.avatar_url ?? ''
      }
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <ToursClient tours={normalizedTours} userRole={currentUser.role || 'tenant'} userId={currentUser.id} />
    </div>
  );
}