import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { default as ToursClient } from '@/app/(app)/tours/ToursClient';

export default async function ToursPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  // Fetch tour slots and booked tours
  const { data: tours } = await supabase
    .from('tours')
    .select(`
      *,
      property:properties(
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
    .or(`tenant_id.eq.${session.user.id},landlord_id.eq.${session.user.id}`)
    .order('scheduled_at', { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <ToursClient tours={tours || []} userRole={session.user.role || 'tenant'} userId={session.user.id} />
    </div>
  );
}