import { SignalIcon, SignalSlashIcon } from "@heroicons/react/24/outline";

import { getSupabaseHealth } from "@/lib/supabase/health";

export async function SupabaseHealthCard() {
  const health = await getSupabaseHealth();
  const isHealthy = health.hasEnv && health.connected;
  const Icon = isHealthy ? SignalIcon : SignalSlashIcon;
  const tone = isHealthy
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <section
      className={`rounded-3xl border px-4 py-4 text-sm shadow-soft sm:px-6 ${tone}`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-current">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-[200px]">
          <p className="text-base font-semibold">
            {isHealthy ? "Supabase connected" : "Supabase unavailable"}
          </p>
          <p className="text-xs opacity-90">
            {health.error
              ? health.error
              : `Latency ${health.latencyMs?.toFixed(0) ?? "?"}ms`}
          </p>
        </div>
        <a
          href="/api/health/db"
          className="rounded-full border border-current px-3 py-1 text-xs font-semibold transition hover:bg-white/20"
        >
          View JSON
        </a>
      </div>
    </section>
  );
}
