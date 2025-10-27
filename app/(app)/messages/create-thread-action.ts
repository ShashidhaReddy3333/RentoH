'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Create a new message thread for a property inquiry
 */
export async function createThreadForProperty(propertyId: string) {
  const supabase = createSupabaseServerClient();
  
  if (!supabase) {
    return { error: 'Messaging is not available. Please contact support.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'You must be signed in to message landlords.' };
  }

  // Get property details to find the owner
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, title, owner_id')
    .eq('id', propertyId)
    .single();

  if (propertyError || !property) {
    console.error('[messages] Property not found', propertyError);
    return { error: 'Property not found.' };
  }

  if (property.owner_id === user.id) {
    return { error: 'You cannot message yourself about your own property.' };
  }

  // Check if thread already exists between these participants
  const { data: existingThreads } = await supabase
    .from('message_threads')
    .select('id')
    .eq('property_id', propertyId)
    .or(`owner_id.eq.${user.id},participant_ids.cs.{${user.id}}`);

  if (existingThreads && existingThreads.length > 0 && existingThreads[0]) {
    // Redirect to existing thread
    redirect(`/messages?t=${existingThreads[0].id}`);
  }

  // Create new thread
  const { data: newThread, error: threadError } = await supabase
    .from('message_threads')
    .insert({
      property_id: propertyId,
      owner_id: user.id,
      participant_ids: [user.id, property.owner_id],
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
  redirect(`/messages?t=${newThread.id}`);
}
