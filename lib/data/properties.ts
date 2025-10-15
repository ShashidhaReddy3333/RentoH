import { supabaseServer } from '@/lib/supabase/server';
import type { Property } from '@/lib/types';

export async function listProperties(): Promise<Property[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('properties')
    .select('id,title,price,image_url,city,created_at,landlord_id')
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    throw error;
  }

  return data ?? [];
}
