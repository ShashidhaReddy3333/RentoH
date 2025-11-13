import { hasSupabaseEnv, missingSupabaseMessage } from "@/lib/env";

const fallbackMessage =
  "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase features.";

export function SupabaseConfigBanner() {
  if (hasSupabaseEnv) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="font-semibold">Supabase connection inactive</p>
      <p className="mt-1 text-amber-800">{missingSupabaseMessage ?? fallbackMessage}</p>
    </div>
  );
}
