import { z } from "zod";

// Supabase URL validation - must be a valid URL when provided
const supabaseUrlSchema = z.string().url().optional();

// Supabase key validation - must be at least 20 characters when provided
const supabaseKeySchema = z.string().min(20, "Supabase keys must be at least 20 characters").optional();

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKeySchema,
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: supabaseKeySchema,
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET_LISTINGS: z.string().min(1).default("listing-media"),
  EMAIL_FROM_ADDRESS: z.string().email().optional()
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKeySchema,
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional()
});

const rawServerEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  NEXT_PUBLIC_SITE_URL: process.env["NEXT_PUBLIC_SITE_URL"],
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env["NEXT_PUBLIC_MAPBOX_TOKEN"],
  SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"],
  SUPABASE_JWT_SECRET: process.env["SUPABASE_JWT_SECRET"],
  SUPABASE_STORAGE_BUCKET_LISTINGS: process.env["SUPABASE_STORAGE_BUCKET_LISTINGS"],
  EMAIL_FROM_ADDRESS: process.env["EMAIL_FROM_ADDRESS"]
};

const serverParsed = serverSchema.safeParse(rawServerEnv);

if (!serverParsed.success) {
  console.error("[env] Invalid environment variables", serverParsed.error.flatten().fieldErrors);
  
  // Only throw in development - in production, log and continue with defaults
  if (process.env.NODE_ENV === 'development') {
    throw new Error("Invalid environment variables. Check your .env files.");
  } else {
    console.warn("[env] Continuing with default/missing environment variables");
  }
}

// Use parsed data if successful, otherwise use raw env with safe defaults
const env = Object.freeze(serverParsed.success ? serverParsed.data : {
  NODE_ENV: process.env.NODE_ENV || 'production',
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  NEXT_PUBLIC_SITE_URL: undefined,
  NEXT_PUBLIC_MAPBOX_TOKEN: undefined,
  SUPABASE_SERVICE_ROLE_KEY: undefined,
  SUPABASE_JWT_SECRET: undefined,
  SUPABASE_STORAGE_BUCKET_LISTINGS: 'listing-media',
  EMAIL_FROM_ADDRESS: undefined
});

const clientParsed = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_MAPBOX_TOKEN: env.NEXT_PUBLIC_MAPBOX_TOKEN
});

if (!clientParsed.success) {
  console.error("[env] Invalid public environment variables", clientParsed.error.flatten().fieldErrors);
  
  // Only throw in development
  if (process.env.NODE_ENV === 'development') {
    throw new Error("Invalid public environment variables. Check NEXT_PUBLIC_* keys.");
  } else {
    console.warn("[env] Continuing with missing public environment variables");
  }
}

const clientEnv = Object.freeze(clientParsed.success ? clientParsed.data : {
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  NEXT_PUBLIC_SITE_URL: undefined,
  NEXT_PUBLIC_MAPBOX_TOKEN: undefined
});

const bypassSupabase = process.env["BYPASS_SUPABASE_AUTH"] === "1";

export { env, clientEnv };

export const hasSupabaseEnv =
  !bypassSupabase && Boolean(clientEnv.NEXT_PUBLIC_SUPABASE_URL && clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const missingSupabaseMessage = 
  "Supabase environment variables are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.";

if (!hasSupabaseEnv && env.NODE_ENV !== "test") {
  console.warn(
    "[env] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing. Supabase features are disabled."
  );
}

