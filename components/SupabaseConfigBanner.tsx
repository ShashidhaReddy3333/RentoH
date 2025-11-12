import Link from "next/link";

import { hasSupabaseEnv } from "@/lib/env";

export function SupabaseConfigBanner() {
  if (hasSupabaseEnv) {
    return null;
  }

  return (
    <div
      role="status"
      className="border border-dashed border-brand-blue/30 bg-brand-blue/5 px-4 py-3 text-sm text-brand-blue"
    >
      <p className="font-semibold">Supabase connection inactive</p>
      <p className="mt-1 text-xs text-brand-blue/80">
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
        your environment to enable real data. Until then we&apos;ll show safe placeholders.
      </p>
      <p className="mt-2 text-xs">
        Need help? Review the{" "}
        <Link
          href="https://supabase.com/docs/guides/getting-started"
          className="font-semibold underline underline-offset-2"
        >
          Supabase quickstart
        </Link>
        {" "}or hit <code>/api/health/db</code> to confirm connectivity.
      </p>
    </div>
  );
}
