"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useAppState } from "@/components/providers/app-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VerificationQueuePage() {
  const { users, setUserVerified } = useAppState();
  const [status, setStatus] = useState<string | null>(null);

  const pending = useMemo(
    () => users.filter((user) => user.role === "landlord" && !user.verified),
    [users]
  );

  const handleDecision = (id: string, approved: boolean) => {
    setUserVerified(id, approved);
    setStatus(
      approved ? "Landlord approved and flagged as verified." : "Landlord verification rejected."
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-textc">Verification queue</h1>
          <p className="text-sm text-textc/70">
            Review submitted documents and confirm landlord identities.
          </p>
        </div>
        <Link href="/admin" className={buttonStyles({ variant: "outline" })}>
          Back to admin
        </Link>
      </header>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-black/10 text-sm text-textc/80 dark:divide-white/10">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-textc/60">
              <tr>
                <th className="px-4 py-3">Landlord</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Submitted ID</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {pending.map((user) => (
                <tr key={user.id} className="hover:bg-surface-muted/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand.primary/20 text-sm font-semibold text-brand.primary">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-textc">{user.name}</div>
                        <div className="text-xs text-textc/60">Landlord</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-textc/70">
                      gov-id-{user.id}.jpg
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className={buttonStyles({ variant: "outline", size: "sm" })}
                        onClick={() => handleDecision(user.id, true)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={buttonStyles({ variant: "ghost", size: "sm" })}
                        onClick={() => handleDecision(user.id, false)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pending.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-textc/60">
                    All caught up! No pending verifications.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {status ? (
        <div className="rounded-lg border border-brand.primary/40 bg-brand.primary/5 px-4 py-3 text-sm text-brand.primary">
          {status}
        </div>
      ) : null}
    </div>
  );
}
