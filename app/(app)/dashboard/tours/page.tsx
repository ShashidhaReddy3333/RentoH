import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import { listUpcomingToursForLandlord, listUpcomingToursForTenant } from "@/lib/data-access/tours";
import { getCurrentUser } from "@/lib/data-access/profile";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Scheduled tours - Rento",
  description: "Review your upcoming property tours."
};

export default async function ScheduledToursPage() {
  if (!hasSupabaseEnv) {
    return (
      <EmptyState
        title="Connect Supabase to see tours"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load scheduled tours."
      />
    );
  }

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
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Scheduled tours</h1>
        <p className="text-sm text-text-muted">
          {user.role === "landlord"
            ? "Review who is touring your properties and prepare any required documents."
            : "Here are the tours you have booked with landlords."
          }
        </p>
      </header>

      <ul className="space-y-4">
        {tours.map((tour) => (
          <li key={tour.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-brand-dark">{tour.propertyTitle}</h2>
                {tour.city ? <p className="text-sm text-text-muted">{tour.city}</p> : null}
              </div>
              <span className="rounded-full bg-brand-teal/10 px-4 py-1 text-sm font-semibold text-brand-teal">
                {formatScheduledDate(tour.scheduledAt)}
              </span>
            </div>
            <div className="mt-4 text-sm text-text-muted capitalize">{tour.status} tour</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatScheduledDate(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return value;
  }
}
