import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET_LISTINGS: z.string().min(1).default("listings"),
  HEALTH_CHECK_TOKEN: z.string().min(1).optional(),
  BYPASS_SUPABASE_AUTH: z.enum(["0", "1"]).optional()
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10).optional(),
  NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS: z.string().min(1).default("listings"),
  NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://rento-h.vercel.app"),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional()
});

const rawServerEnv = {
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"],
  SUPABASE_JWT_SECRET: process.env["SUPABASE_JWT_SECRET"],
  SUPABASE_STORAGE_BUCKET_LISTINGS: process.env["SUPABASE_STORAGE_BUCKET_LISTINGS"],
  HEALTH_CHECK_TOKEN: process.env["HEALTH_CHECK_TOKEN"],
  BYPASS_SUPABASE_AUTH: process.env["BYPASS_SUPABASE_AUTH"]
};

const rawClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS: process.env["NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS"],
  NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS: process.env["NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS"],
  NEXT_PUBLIC_SITE_URL: process.env["NEXT_PUBLIC_SITE_URL"],
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env["NEXT_PUBLIC_MAPBOX_TOKEN"]
};

const serverParsed = serverSchema.safeParse(rawServerEnv);
if (!serverParsed.success) {
  console.error("[env] Invalid server environment variables", serverParsed.error.flatten().fieldErrors);
  throw new Error("Invalid server environment variables. Check your configuration.");
}

const clientParsed = clientSchema.safeParse(rawClientEnv);
if (!clientParsed.success) {
  console.warn("[env] Missing or invalid public environment variables", clientParsed.error.flatten().fieldErrors);
}

const DEFAULT_BUCKET = "listings";
const DEFAULT_SITE_URL = "https://rento-h.vercel.app";

type ClientEnv = z.infer<typeof clientSchema>;
const clientEnv: ClientEnv = Object.freeze({
  NEXT_PUBLIC_SUPABASE_URL: rawClientEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: rawClientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS:
    rawClientEnv.NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS ?? DEFAULT_BUCKET,
  NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS: rawClientEnv.NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS,
  NEXT_PUBLIC_SITE_URL:
    rawClientEnv.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  NEXT_PUBLIC_MAPBOX_TOKEN: rawClientEnv.NEXT_PUBLIC_MAPBOX_TOKEN
});

export const env = Object.freeze({
  ...serverParsed.data,
  ...clientEnv
});

export { clientEnv };

const bypassSupabase = env.BYPASS_SUPABASE_AUTH === "1";

export const hasSupabaseEnv =
  !bypassSupabase &&
  Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const missingSupabaseMessage =
  "Supabase environment variables are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.";

if (!hasSupabaseEnv && env.NODE_ENV !== "test") {
  console.warn(
    "[env] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing. Supabase features are disabled."
  );
}
