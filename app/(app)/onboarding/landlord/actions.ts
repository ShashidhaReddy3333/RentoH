'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function upgradToLandlord() {
  const supabase = createSupabaseServerClient();
  
  if (!supabase) {
    return { error: 'Supabase is not configured. Please contact support.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'You must be signed in to upgrade to landlord.' };
  }

  // Update user metadata to include landlord role
  const { error: updateError } = await supabase.auth.updateUser({
    data: { role: 'landlord' }
  });

  if (updateError) {
    console.error('[onboarding] Failed to upgrade user to landlord', updateError);
    return { error: 'Failed to upgrade your account. Please try again.' };
  }

  // Update profile in database if profiles table exists
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'landlord' })
    .eq('id', user.id);

  if (profileError) {
    console.warn('[onboarding] Failed to update profile role', profileError);
    // Don't fail the whole operation if profile update fails
  }

  revalidatePath('/dashboard');
  revalidatePath('/profile');
  
  redirect('/dashboard?upgraded=landlord');
}
