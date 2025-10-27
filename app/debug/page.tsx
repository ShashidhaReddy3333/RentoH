/**
 * Debug page to check environment variables and deployment status
 * Access at: /debug
 */
export default function DebugPage() {
  const hasSupabaseUrl = Boolean(process.env["NEXT_PUBLIC_SUPABASE_URL"]);
  const hasSupabaseAnonKey = Boolean(process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
  const hasSiteUrl = Boolean(process.env["NEXT_PUBLIC_SITE_URL"]);
  const nodeEnv = process.env["NODE_ENV"];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Deployment Debug Info</h1>
      
      <div className="rounded-lg border border-gray-300 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Environment Variables</h2>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className={hasSupabaseUrl ? "text-green-600" : "text-red-600"}>
              {hasSupabaseUrl ? "✅" : "❌"}
            </span>
            <span>NEXT_PUBLIC_SUPABASE_URL: {hasSupabaseUrl ? "Set" : "Missing"}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={hasSupabaseAnonKey ? "text-green-600" : "text-red-600"}>
              {hasSupabaseAnonKey ? "✅" : "❌"}
            </span>
            <span>NEXT_PUBLIC_SUPABASE_ANON_KEY: {hasSupabaseAnonKey ? "Set" : "Missing"}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={hasSiteUrl ? "text-green-600" : "text-red-600"}>
              {hasSiteUrl ? "✅" : "❌"}
            </span>
            <span>NEXT_PUBLIC_SITE_URL: {hasSiteUrl ? "Set" : "Missing"}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-blue-600">ℹ️</span>
            <span>NODE_ENV: {nodeEnv}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Next Steps</h2>
        {!hasSupabaseUrl || !hasSupabaseAnonKey ? (
          <div className="space-y-2 text-sm">
            <p className="text-red-600 font-semibold">⚠️ Missing required environment variables</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
              <li>Add the missing environment variables</li>
              <li>Redeploy your application</li>
            </ol>
          </div>
        ) : (
          <p className="text-green-600">✅ All required environment variables are set!</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Build Information</h2>
        <div className="space-y-1 font-mono text-sm">
          <p>Build Time: {new Date().toISOString()}</p>
          <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'}</p>
        </div>
      </div>
    </div>
  );
}
