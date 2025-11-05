import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import { listApplicationsForLandlord, listApplicationsForTenant } from "@/lib/data-access/applications";
import { getCurrentUser } from "@/lib/data-access/profile";
import { hasSupabaseEnv } from "@/lib/env";
import type { ApplicationSummary } from "@/lib/types";

export const metadata: Metadata = {
  title: "Applications - Rento",
  description: "Track rental applications in progress."
};

export default async function ApplicationsPage() {
  if (!hasSupabaseEnv) {
    return (
      <EmptyState
        title="Connect Supabase to review applications"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load live application data."
      />
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view applications"
        description="Once you sign in you can review submissions, track status, and respond to renters."
        action={
          <Link href={{ pathname: "/auth/sign-in" }} className={buttonStyles({ variant: "primary", size: "md" })}>
            Sign in
          </Link>
        }
      />
    );
  }

  const applications =
    user.role === "landlord"
      ? await listApplicationsForLandlord(25)
      : await listApplicationsForTenant(25);

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description={
          user.role === "landlord"
            ? "You have no applications in review. Promote your listings to attract renters."
            : "You haven't submitted any rental applications. Start by finding a home you love."
        }
        action={
          <Link
            href={{ pathname: user.role === "landlord" ? "/dashboard/listings" : "/browse" }}
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            {user.role === "landlord" ? "Manage listings" : "Browse listings"}
          </Link>
        }
      />
    );
  }

  const title = user.role === "landlord" ? "Recent applications" : "Your rental applications";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">{title}</h1>
        <p className="text-sm text-text-muted">
          {user.role === "landlord"
            ? "Review who has applied to your listings and follow up with prospective renters."
            : "Track the status of the rental applications you have submitted."
          }
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-soft">
        <table className="min-w-full divide-y divide-black/5 text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold text-brand-dark">Property</th>
              <th scope="col" className="px-6 py-3 font-semibold text-brand-dark">
                {user.role === "landlord" ? "Applicant" : "Status"}
              </th>
              {user.role === "landlord" ? (
                <th scope="col" className="px-6 py-3 font-semibold text-brand-dark">Status</th>
              ) : (
                <th scope="col" className="px-6 py-3 font-semibold text-brand-dark">Submitted</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {applications.map((application) => (
              <ApplicationRow key={application.id} application={application} isLandlord={user.role === "landlord"} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApplicationRow({ application, isLandlord }: { application: ApplicationSummary; isLandlord: boolean }) {
  return (
    <tr>
      <td className="px-6 py-4 text-sm font-semibold text-brand-dark">{application.propertyTitle}</td>
      <td className="px-6 py-4 text-sm text-text-muted">
        {isLandlord ? application.applicantName : capitalize(application.status)}
      </td>
      <td className="px-6 py-4 text-sm text-text-muted">
        {isLandlord ? capitalize(application.status) : new Date(application.submittedAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
