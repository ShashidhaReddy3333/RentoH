'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type UpdateStatusResult = {
  success: boolean;
  error?: string;
};

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: string
): Promise<UpdateStatusResult> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify the user is the landlord for this application
  const { data: application } = await supabase
    .from('applications')
    .select('landlord_id, tenant_id, status')
    .eq('id', applicationId)
    .single();

  if (!application || application.landlord_id !== user.id) {
    return { success: false, error: 'Unauthorized - not the landlord' };
  }

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    submitted: ['reviewing', 'approved', 'rejected'],
    reviewing: ['interview', 'approved', 'rejected'],
    interview: ['approved', 'rejected'],
  };

  const currentStatus = application.status || 'submitted';
  if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
    return { success: false, error: `Invalid status transition from ${currentStatus} to ${newStatus}` };
  }

  // Build update payload
  const updatePayload: Record<string, string> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'reviewing') {
    updatePayload['reviewed_at'] = new Date().toISOString();
  } else if (newStatus === 'approved' || newStatus === 'rejected') {
    updatePayload['decision_at'] = new Date().toISOString();
  }

  // Update the application
  const { error } = await supabase
    .from('applications')
    .update(updatePayload)
    .eq('id', applicationId);

  if (error) {
    console.error('[applications] Failed to update status', error);
    return { success: false, error: 'Failed to update application' };
  }

  // Trigger notification for tenant
  try {
    const origin = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000';
    await fetch(`${origin}/api/digest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: application.tenant_id, reason: 'application_update' }),
    });
  } catch (err) {
    console.error('[applications] Failed to trigger notification', err);
    // Don't fail the request if notification fails
  }

  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/dashboard');

  return { success: true };
}
