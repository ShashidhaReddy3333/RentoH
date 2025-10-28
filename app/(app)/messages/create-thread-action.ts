'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

function resolveThreadRedirect(threadId: string) {
  redirect(`/messages?t=${threadId}`);
}

/**
 * Create a new message thread for a property inquiry
 */
export async function createThreadForProperty(propertyIdentifier: string) {
  const supabase = createSupabaseServerClient();
  
  if (!supabase) {
    return { error: 'Messaging is not available. Please contact support.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'You must be signed in to message landlords.' };
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, title, landlord_id, slug')
    .or(`id.eq.${propertyIdentifier},slug.eq.${propertyIdentifier}`)
    .maybeSingle();

  if (propertyError || !property) {
    console.error('[messages] Property not found', propertyError);
    return { error: 'Property not found.' };
  }

  if (property.landlord_id === user.id) {
    return { error: 'You cannot message yourself about your own property.' };
  }

  const tenantId = user.id;
  const landlordId = property.landlord_id;

  // Check if thread already exists between these participants for this property
  const { data: existingThreads, error: existingError } = await supabase
    .from('message_threads')
    .select('id')
    .eq('property_id', property.id)
    .or(`tenant_id.eq.${tenantId},landlord_id.eq.${tenantId}`)
    .or(`tenant_id.eq.${landlordId},landlord_id.eq.${landlordId}`)
    .limit(1);

  if (existingError) {
    console.error('[messages] Failed checking existing threads', existingError);
  }

  if (existingThreads && existingThreads.length > 0 && existingThreads[0]) {
    // Redirect to existing thread
    resolveThreadRedirect(existingThreads[0].id);
  }

  // Create new thread
  const { data: newThread, error: threadError } = await supabase
    .from('message_threads')
    .insert({
      property_id: property.id,
      tenant_id: tenantId,
      landlord_id: landlordId,
      subject: `Inquiry about ${property.title}`,
      last_message: 'Thread created'
    })
    .select('id')
    .single();

  if (threadError || !newThread) {
    console.error('[messages] Failed to create thread', threadError);
    return { error: 'Failed to start conversation. Please try again.' };
  }

  // Redirect to the new thread
  resolveThreadRedirect(newThread.id);
}
