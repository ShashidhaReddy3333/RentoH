import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import { listUpcomingToursForLandlord, listUpcomingToursForTenant } from "@/lib/data-access/tours";
import { getCurrentUser } from "@/lib/data-access/profile";
import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import { DashboardTourList } from "@/components/tours/DashboardTourList";

export const metadata: Metadata = {
  title: "Scheduled tours - Rento",
  description: "Review your upcoming property tours."
};

export default async function ScheduledToursPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view scheduled tours"
        description="Once you sign in you can review upcoming tours and manage invites."
        action={
          <Link href={{ pathname: "/auth/sign-in" }} className={buttonStyles({ variant: "primary", size: "md" })}>
            Sign in
          </Link>
        }
      />
    );
  }

  const tours =
    user.role === "landlord"
      ? await listUpcomingToursForLandlord(20)
      : await listUpcomingToursForTenant(20);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  if (tours.length === 0) {
    return (
      <EmptyState
        title="No tours booked yet"
        description={
          user.role === "landlord"
            ? "Encourage renters to schedule tours from your active listings."
            : "Browse listings and request a tour that works for your schedule."
        }
        action={
          <Link
            href={{ pathname: user.role === "landlord" ? "/dashboard/listings" : "/browse" }}
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            {user.role === "landlord" ? "Manage listings" : "Find homes"}
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <SupabaseConfigBanner />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Scheduled tours</h1>
        <p className="text-sm text-text-muted">
          {user.role === "landlord"
            ? "Review who is touring your properties and prepare any required documents."
            : "Here are the tours you have booked with landlords."}
        </p>
      </header>

      <DashboardTourList tours={tours} userRole={user.role} localTimezone={timezone} />
    </div>
  );
}
