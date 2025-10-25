import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LandlordOnboardingPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  // Check if already landlord
  if (session.user.role === 'landlord') {
    redirect('/app/dashboard');
  }

  async function handleUpgrade() {
    // Update user metadata/role in Supabase
    const { error } = await supabase.auth.updateUser({
      data: { role: 'landlord' },
    });
    if (!error) {
      // Optionally, refresh session or redirect
      window.location.href = '/app/dashboard';
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">Become a Landlord</h1>
      <p className="mb-4">To list and manage properties, you must accept the terms and become a landlord.</p>
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Terms & Conditions</h2>
        <p className="text-sm mb-2">By upgrading, you agree to our landlord terms of service. (Add your terms here.)</p>
        <div className="text-xs text-gray-500 mb-2">Identity verification coming soon.</div>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleUpgrade}
      >
        Accept & Become Landlord
      </button>
    </div>
  );
}
