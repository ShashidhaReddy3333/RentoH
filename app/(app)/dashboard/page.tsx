import type { ComponentProps } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon
} from "@heroicons/react/24/outline";

import EmptyState from "@/components/EmptyState";
import PropertyCard from "@/components/PropertyCard";
import StatCard from "@/components/StatCard";
import { buttonStyles } from "@/components/ui/button";
import { listFavoriteProperties } from "@/lib/data-access/favorites";
import { listApplicationsForLandlord, listApplicationsForTenant } from "@/lib/data-access/applications";
import { listThreads } from "@/lib/data-access/messages";
import { getCurrentUser, getProfile } from "@/lib/data-access/profile";
import { listOwnedProperties } from "@/lib/data-access/properties";
import { listUpcomingToursForLandlord, listUpcomingToursForTenant } from "@/lib/data-access/tours";
import { hasSupabaseEnv } from "@/lib/env";
import type { ApplicationSummary, Tour } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard - Rento",
  description: "Stay on top of saved homes, tours, messages, and listings."
};

export default async function DashboardPage() {
  if (!hasSupabaseEnv) {
    return (
      <EmptyState
        title="Connect Supabase to unlock the dashboard"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load live data for listings, tours, and applications."
      />
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        title="Sign in to access your dashboard"
        description="Track saved homes, manage listing applications, and message landlords securely."
        action={
          <Link
            href={{ pathname: "/auth/sign-in" }}
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            Sign in
          </Link>
        }
      />
    );
  }

  if (user.role === "landlord") {
    return <LandlordDashboard />;
  }

  return <TenantDashboard />;
}

async function TenantDashboard() {
  const [profile, threads, favorites, tours, applications] = await Promise.all([
    getProfile(),
    listThreads(),
    listFavoriteProperties(3),
    listUpcomingToursForTenant(3),
    listApplicationsForTenant(3)
  ]);

  const unreadMessages = threads.reduce((total, thread) => total + thread.unreadCount, 0);
  const primaryName = profile?.name?.split(" ")[0] ?? "there";

  const stats = [
    {
      title: "Saved homes",
      value: favorites.length,
      change: favorites.length ? `${favorites.length} ready to review` : undefined,
      icon: <HomeModernIcon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
    },
    {
      title: "Applications",
      value: applications.length,
      change: applications.length ? `${applications.length} submitted` : undefined,
      icon: <ClipboardDocumentListIcon className="h-6 w-6 text-brand-blue" aria-hidden="true" />
    },
    {
      title: "Tours booked",
      value: tours.length,
      change: tours[0] ? formatRelativeDate(tours[0].scheduledAt) : undefined,
      icon: <CalendarIcon className="h-6 w-6 text-brand-green" aria-hidden="true" />
    },
    {
      title: "Unread messages",
      value: unreadMessages,
      icon: <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
    }
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Welcome back, {primaryName}</h1>
        <p className="text-sm text-text-muted">
          Track saved homes, messages, and upcoming tours all in one place.
        </p>
      </header>

      <DashboardStats stats={stats} />

      <section className="grid gap-6 lg:grid-cols-2">
        <RecentMessages threads={threads} />
        <UpcomingTours tours={tours} role="tenant" />
      </section>

      <SavedListings favorites={favorites} />

      <ApplicationsTable title="Applications in review" applications={applications} emptyLabel="You have no active applications yet." />
    </div>
  );
}

async function LandlordDashboard() {
  const [profile, threads, ownedProperties, tours, applications] = await Promise.all([
    getProfile(),
    listThreads(),
    listOwnedProperties(6),
    listUpcomingToursForLandlord(3),
    listApplicationsForLandlord(5)
  ]);

  const unreadMessages = threads.reduce((total, thread) => total + thread.unreadCount, 0);
  const primaryName = profile?.name?.split(" ")[0] ?? "there";
  const activeListings = ownedProperties.filter((property) => property.status !== "draft");
  const draftListings = ownedProperties.filter((property) => property.status === "draft");

  const stats = [
    {
      title: "Active listings",
      value: activeListings.length,
      change: draftListings.length ? `${draftListings.length} drafts ready` : undefined,
      icon: <HomeModernIcon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
    },
    {
      title: "Applications",
      value: applications.length,
      change: applications.length ? `${applications.length} awaiting review` : undefined,
      icon: <ClipboardDocumentListIcon className="h-6 w-6 text-brand-blue" aria-hidden="true" />
    },
    {
      title: "Upcoming tours",
      value: tours.length,
      change: tours[0] ? formatRelativeDate(tours[0].scheduledAt) : undefined,
      icon: <CalendarIcon className="h-6 w-6 text-brand-green" aria-hidden="true" />
    },
    {
      title: "Unread messages",
      value: unreadMessages,
      icon: <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
    }
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-brand-dark">Welcome back, {primaryName}</h1>
          <p className="text-sm text-text-muted">Manage listings, review applications, and stay responsive.</p>
        </div>
        <Link href={{ pathname: "/listings/new" }} className={buttonStyles({ variant: "primary", size: "md" })}>
          New listing
          <ArrowRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
        </Link>
      </header>

      <DashboardStats stats={stats} />

      <section className="grid gap-6 lg:grid-cols-2">
        <YourListings active={activeListings} drafts={draftListings} />
        <UpcomingTours tours={tours} role="landlord" />
      </section>

      <RecentMessages threads={threads} />

      <ApplicationsTable
        title="Recent applications"
        applications={applications}
        emptyLabel="No applications yet. Promote your listings to start receiving applicants."
      />
    </div>
  );
}

function DashboardStats({ stats }: { stats: Array<ComponentProps<typeof StatCard>> }) {
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </section>
  );
}

function RecentMessages({ threads }: { threads: Awaited<ReturnType<typeof listThreads>> }) {
  return (
    <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">Recent messages</h2>
        <Link
          href={{ pathname: "/messages" }}
          className="text-sm font-semibold text-brand-blue transition hover:text-brand-teal"
        >
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {threads.length === 0 ? (
          <p className="text-sm text-text-muted">No messages yet. Reach out to landlords to start a conversation.</p>
        ) : (
          threads.slice(0, 4).map((thread) => (
            <Link
              key={thread.id}
              href={{ pathname: "/messages", query: { t: thread.id } }}
              className="flex items-center justify-between rounded-2xl border border-black/5 bg-surface px-4 py-3 text-sm transition hover:border-brand-blue/40 hover:bg-brand-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <span className="font-semibold text-brand-dark">{thread.otherPartyName}</span>
              <span className="text-xs text-text-muted">
                {thread.lastMessage ?? "No messages yet"}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function SavedListings({ favorites }: { favorites: Awaited<ReturnType<typeof listFavoriteProperties>> }) {
  return (
    <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-dark">Saved homes</h2>
          <p className="text-sm text-text-muted">Snapshot of the listings you favourited most recently.</p>
        </div>
        <Link href={{ pathname: "/favorites" }} className="text-sm font-semibold text-brand-blue hover:text-brand-teal">
          Manage favorites
        </Link>
      </div>
      {favorites.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {favorites.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">You haven&apos;t saved any homes yet. Browse listings to get started.</p>
      )}
    </section>
  );
}

function YourListings({
  active,
  drafts
}: {
  active: Awaited<ReturnType<typeof listOwnedProperties>>;
  drafts: Awaited<ReturnType<typeof listOwnedProperties>>;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">Your listings</h2>
        <Link
          href={{ pathname: "/dashboard/listings" }}
          className="text-sm font-semibold text-brand-blue transition hover:text-brand-teal"
        >
          Manage listings
        </Link>
      </div>
      {active.length === 0 && drafts.length === 0 ? (
        <p className="text-sm text-text-muted">
          No listings yet. Create your first listing to reach verified renters.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[...active, ...drafts].map((property) => (
            <div key={property.id} className="space-y-3 rounded-3xl border border-black/5 bg-surface px-4 py-4">
              <p className="text-sm font-semibold text-brand-dark">{property.title}</p>
              <p className="text-xs text-text-muted">
                ${property.price.toLocaleString()} · {property.city}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    property.status === "draft"
                      ? "bg-brand-blue/10 text-brand-blue"
                      : "bg-brand-green/10 text-brand-green"
                  }`}
                >
                  {property.status === "draft" ? "Draft" : "Active"}
                </span>
                <Link
                  href={{ pathname: "/dashboard/listings/[id]", query: { id: property.id } }}
                  className="text-xs font-semibold text-brand-blue hover:text-brand-teal"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingTours({ tours, role }: { tours: Tour[]; role: "tenant" | "landlord" }) {
  const label = role === "tenant" ? "Upcoming tours" : "Scheduled tours";
  const emptyLabel =
    role === "tenant"
      ? "No tours on the calendar. Request one from a listing to get started."
      : "No tours booked yet. Encourage renters to schedule visits.";

  return (
    <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">{label}</h2>
        <Link
          href={{ pathname: role === "tenant" ? "/dashboard/tours" : "/dashboard/listings" }}
          className="text-sm font-semibold text-brand-blue transition hover:text-brand-teal"
        >
          View details
        </Link>
      </div>
      {tours.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3 text-sm">
          {tours.map((tour) => (
            <li key={tour.id} className="flex items-center justify-between rounded-2xl border border-black/5 bg-surface px-4 py-3">
              <div>
                <p className="font-semibold text-brand-dark">{tour.propertyTitle}</p>
                <p className="text-xs text-text-muted">
                  {formatDateTime(tour.scheduledAt)}
                  {tour.city ? ` · ${tour.city}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold capitalize text-brand-blue">
                {tour.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApplicationsTable({
  title,
  applications,
  emptyLabel
}: {
  title: string;
  applications: ApplicationSummary[];
  emptyLabel: string;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">{title}</h2>
        <Link
          href={{ pathname: "/dashboard/applications" }}
          className="text-sm font-semibold text-brand-blue transition hover:text-brand-teal"
        >
          See all
        </Link>
      </div>
      {applications.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyLabel}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5">
          <table className="min-w-full divide-y divide-black/5 text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Applicant
                </th>
                <th scope="col" className="px-4 py-3">
                  Property
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white">
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="px-4 py-3 font-semibold text-brand-dark">{application.applicantName}</td>
                  <td className="px-4 py-3 text-text-muted">{application.propertyTitle}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold capitalize text-brand-teal">
                      {application.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatDateTime(application.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (Number.isNaN(days)) {
    return undefined;
  }

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;
  return `Past ${Math.abs(days)} days ago`;
}




