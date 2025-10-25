import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { default as ApplicationsClient } from '@/app/(app)/applications/ApplicationsClient';

export default async function ApplicationsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      property:properties(
        title,
        address,
        images,
        price
      ),
      applicant:profiles!applications_applicant_id_fkey(
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

  return (
    <div className="container mx-auto px-4 py-8">
      <ApplicationsClient applications={applications || []} userRole={session.user.role || 'tenant'} />
    </div>
  );
}