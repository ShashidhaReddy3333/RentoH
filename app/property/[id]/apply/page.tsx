import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PropertyApplicationForm } from '@/app/property/[id]/apply/PropertyApplicationForm';

export default async function ApplyPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  const { data: property } = await supabase
    .from('properties')
    .select(`
      *,
      landlord:profiles!properties_landlord_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('id', params.id)
    .single();

  if (!property) {
    redirect('/browse');
  }

  // Check if user has already applied
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id, status')
    .eq('property_id', params.id)
    .eq('applicant_id', session.user.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {existingApplication ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Application Already Submitted</h1>
            <p className="text-gray-600 mb-4">
              You have already applied for this property. Your application status is:{' '}
              <span className="font-semibold">{existingApplication.status}</span>
            </p>
            <p className="text-gray-600">
              You can view your application status in your{' '}
              <a href="/applications" className="text-blue-600 hover:underline">
                applications dashboard
              </a>
              .
            </p>
          </div>
        ) : (
          <PropertyApplicationForm
            propertyId={params.id}
            landlordId={property.landlord.id}
            propertyTitle={property.title}
            userId={session.user.id}
          />
        )}
      </div>
    </div>
  );
}