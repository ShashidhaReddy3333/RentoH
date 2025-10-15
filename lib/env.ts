import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20)
});

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
};

const parsed = schema.safeParse(rawEnv);

if (!parsed.success) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('Supabase environment variables are not fully configured. Falling back to placeholder values.');
  }
}

const fallback = schema.parse({
  NODE_ENV: rawEnv.NODE_ENV ?? 'development',
  NEXT_PUBLIC_SUPABASE_URL: rawEnv.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'local-anon-key-placeholder-123456'
});

export const env = parsed.success ? parsed.data : fallback;
export const hasSupabaseEnv = parsed.success;
