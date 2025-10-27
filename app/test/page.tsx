/**
 * Simple test page to verify Vercel deployment is working
 * Visit at: /test
 */
export default function TestPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h1 className="text-4xl font-bold">✅ Deployment Working!</h1>
      <p className="text-lg">If you can see this, your Next.js app is deployed correctly.</p>
      <div className="rounded-lg border border-gray-300 bg-white p-4 text-left">
        <h2 className="mb-2 font-semibold">Next Steps:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Visit <code className="bg-gray-100 px-1">/debug</code> to check environment variables</li>
          <li>Visit <code className="bg-gray-100 px-1">/</code> for the home page</li>
          <li>Check browser console for any errors</li>
        </ul>
      </div>
    </div>
  );
}
