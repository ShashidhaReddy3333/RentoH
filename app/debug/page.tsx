export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { clientEnv, env } from "@/lib/env";

export default function DebugPage() {
  if (env.NODE_ENV !== "development") {
    notFound();
  }

  const hasSupabaseUrl = Boolean(clientEnv.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseAnonKey = Boolean(clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasSiteUrl = Boolean(clientEnv.NEXT_PUBLIC_SITE_URL);
  const nodeEnv = env.NODE_ENV;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Deployment Debug Info</h1>

      <section className="rounded-lg border border-gray-300 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Environment Variables</h2>
        <dl className="space-y-2 font-mono text-sm">
          <DebugItem label="NEXT_PUBLIC_SUPABASE_URL" ok={hasSupabaseUrl} />
          <DebugItem label="NEXT_PUBLIC_SUPABASE_ANON_KEY" ok={hasSupabaseAnonKey} />
          <DebugItem label="NEXT_PUBLIC_SITE_URL" ok={hasSiteUrl} />
          <DebugItem label="NODE_ENV" ok value={nodeEnv} />
        </dl>
      </section>

      <section className="rounded-lg border border-gray-300 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Next Steps</h2>
        {!hasSupabaseUrl || !hasSupabaseAnonKey ? (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-red-600">Missing required Supabase environment variables</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Open your Vercel project settings.</li>
              <li>Add the missing keys to Environment Variables.</li>
              <li>Trigger a redeploy.</li>
            </ol>
          </div>
        ) : (
          <p className="text-green-600">All required Supabase environment variables are set.</p>
        )}
      </section>

      <section className="rounded-lg border border-gray-300 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Build Snapshot</h2>
        <dl className="space-y-1 font-mono text-sm">
          <div>
            <dt className="font-semibold">Render Time</dt>
            <dd>{new Date().toISOString()}</dd>
          </div>
          <div>
            <dt className="font-semibold">Runtime</dt>
            <dd>Server (React)</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function DebugItem({ label, ok, value }: { label: string; ok: boolean; value?: string | boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={ok ? "text-green-600" : "text-red-600"}>{ok ? "OK" : "X"}</span>
      <span>
        {label}: {value ?? (ok ? "Set" : "Missing")}
      </span>
    </div>
  );
}

