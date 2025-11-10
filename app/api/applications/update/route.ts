import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify the user is the landlord for this application
  const { data: application } = await supabase
    .from('applications')
    .select('landlord_id, tenant_id')
    .eq('id', id)
    .single();

  if (!application || application.landlord_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Update the application
  const { error } = await supabase
    .from('applications')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('[applications] Failed to update status', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }

  // Trigger notification for tenant
  try {
    await fetch(`${request.nextUrl.origin}/api/digest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: application.tenant_id, reason: 'application_update' })
    });
  } catch (err) {
    console.error('[applications] Failed to trigger notification', err);
  }

  revalidatePath('/applications');
  revalidatePath(`/applications/${id}`);
  revalidatePath('/dashboard');
  
  redirect(`/applications/${id}`);
}
