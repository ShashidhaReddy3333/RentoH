import { hasSupabaseEnv } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Property } from '@/lib/types';

export async function listProperties(): Promise<Property[]> {
  if (!hasSupabaseEnv) {
    return [];
  }

  try {
    const sb = createSupabaseServerClient();
    const { data, error } = await sb
      .from('properties')
      .select('id,title,price,image_url,city,created_at,landlord_id')
      .order('created_at', { ascending: false })
      .limit(24);

    if (error) {
      const code = (error as { code?: string }).code;
      // Gracefully handle missing table errors to avoid failing builds
      if (code === 'PGRST205' || code === '42P01') {
        console.warn('[browse] properties table not found; returning empty list');
        return [];
      }
      throw error;
    }

    return data ?? [];
  } catch (err) {
    const e = err as { message?: string; code?: string };
    console.error('[browse] fetch properties failed', {
      message: e?.message,
      code: e?.code
    });
    return [];
  }
}
