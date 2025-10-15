
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/providers/app-provider";

export default function VerificationQueuePage() {
  const { users, setUserVerified } = useAppState();
  const [status, setStatus] = useState<string | null>(null);

  const pending = useMemo(
    () => users.filter((user) => user.role === "landlord" && !user.verified),
    [users]
  );

  const handleDecision = (id: string, approved: boolean) => {
    setUserVerified(id, approved);
    setStatus(approved ? "Landlord approved and flagged as verified." : "Landlord verification rejected.");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--c-dark)]">Verification queue</h1>
          <p className="text-sm text-gray-600">
            Review submitted documents and confirm landlord identities.
          </p>
        </div>
        <Link href="/admin" className="btn btn-secondary">
          Back to admin
        </Link>
      </header>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Landlord</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Submitted ID</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {pending.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--c-primary)]/20 text-[var(--c-primary)] flex items-center justify-center text-sm font-semibold">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--c-dark)]">{user.name}</div>
                      <div className="text-xs text-gray-500">Landlord</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    gov-id-{user.id}.jpg
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDecision(user.id, true)}
                    >
                      Approve
                    </button>
                    <button type="button" className="btn" onClick={() => handleDecision(user.id, false)}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!pending.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  All caught up! No pending verifications.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {status && (
        <div className="rounded-lg border border-[var(--c-primary)]/40 bg-[var(--c-primary)]/5 px-4 py-3 text-sm text-[var(--c-primary)]">
          {status}
        </div>
      )}
    </div>
  );
}
