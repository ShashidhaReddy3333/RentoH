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
import { listThreads } from "@/lib/data-access/messages";
import { getCurrentUser, getProfile } from "@/lib/data-access/profile";
import { getMany } from "@/lib/data-access/properties";

export const metadata: Metadata = {
  title: "Dashboard - Rento",
  description: "Stay on top of saved homes, tours, messages, and listings."
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        title="Sign in to access your dashboard"
        description="Track saved homes, manage listing applications, and message landlords securely."
        action={
          <Link href={{ pathname: "/auth/sign-in" }} className={buttonStyles({ variant: "primary", size: "md" })}>
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
  const [profile, threads, listings] = await Promise.all([
    getProfile(),
    listThreads(),
    getMany({}, "newest", 1)
  ]);

  const savedListings = listings.items.slice(0, 3);

  const upcomingTours = [
    {
      id: "tour_01",
      title: "Sunlit Loft near King Street",
      date: "Friday, Oct 25 at 6:00 PM",
      location: "Waterloo",
      status: "Confirmed"
    },
    {
      id: "tour_02",
      title: "Riverwalk Modern Condo",
      date: "Sunday, Oct 27 at 11:00 AM",
      location: "Kitchener",
      status: "Requested"
    }
  ];

  const stats = [
    {
      title: "Saved homes",
      value: savedListings.length,
      change: profile.prefs.areas?.length ? `Tracked in ${profile.prefs.areas.length} areas` : undefined,
      icon: <HomeModernIcon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
    },
    {
      title: "Applications",
      value: 2,
      change: "2 awaiting review",
      icon: <ClipboardDocumentListIcon className="h-6 w-6 text-brand-blue" aria-hidden="true" />
    },
    {
      title: "Tours booked",
      value: upcomingTours.length,
      change: "This week",
      icon: <CalendarIcon className="h-6 w-6 text-brand-green" aria-hidden="true" />
    },
    {
      title: "Unread messages",
      value: threads.reduce((count, thread) => count + thread.unreadCount, 0),
      icon: (
        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
      )
    }
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Welcome back, {profile.name.split(" ")[0]}</h1>
        <p className="text-sm text-text-muted">
          Track saved homes, messages, and upcoming tours all in one place.
        </p>
      </header>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
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
          {threads.length ? (
            <ul className="space-y-3">
              {threads.slice(0, 3).map((thread) => (
                <li
                  key={thread.id}
                  className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{thread.otherPartyName}</p>
                    <p className="text-xs text-text-muted line-clamp-1">
                      {thread.lastMessage ?? "Start the conversation"}
                    </p>
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="rounded-full bg-brand-teal px-3 py-1 text-xs font-semibold text-white">
                      {thread.unreadCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="You have no conversations yet"
              description="Connect with landlords to ask questions and schedule tours."
              action={
                <Link
                  href={{ pathname: "/browse" }}
                  className={buttonStyles({ variant: "outline", size: "sm" })}
                >
                  Browse homes
                </Link>
              }
            />
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-dark">Saved listings</h2>
            <Link
              href={{ pathname: "/browse", query: { saved: "true" } }}
              className="text-sm font-semibold text-brand-blue transition hover:text-brand-teal"
            >
              Manage
            </Link>
          </div>
          {savedListings.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {savedListings.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No saved homes yet"
              description="Save homes you love to compare them later."
              action={
                <Link
                  href={{ pathname: "/browse" }}
                  className={buttonStyles({ variant: "outline", size: "sm" })}
                >
                  Find homes
                </Link>
              }
            />
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-dark">Upcoming tours</h2>
          <Link
            href={{ pathname: "/messages" }}
            className="text-sm font-semibold text-brand-blue transition hover:text-brand-teal"
          >
            Message landlord
          </Link>
        </div>
        <ul className="grid gap-3">
          {upcomingTours.map((tour) => (
            <li key={tour.id} className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-brand-dark">{tour.title}</p>
                <p className="text-xs text-text-muted">
                  {tour.date} - {tour.location}
                </p>
              </div>
              <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal">
                {tour.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function LandlordDashboard() {
  const [threads, listings] = await Promise.all([listThreads(), getMany({}, "newest", 1)]);

  const activeListings = listings.items.slice(0, 3);
  const draftListings = listings.items.slice(3, 5);

  const stats = [
    {
      title: "Active listings",
      value: activeListings.length,
      icon: <HomeModernIcon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
    },
    {
      title: "Drafts",
      value: draftListings.length,
      icon: <ClipboardDocumentListIcon className="h-6 w-6 text-brand-blue" aria-hidden="true" />
    },
    {
      title: "Applications",
      value: 5,
      change: "3 awaiting review",
      icon: <CalendarIcon className="h-6 w-6 text-brand-green" aria-hidden="true" />
    },
    {
      title: "Unread messages",
      value: threads.reduce((count, thread) => count + thread.unreadCount, 0),
      icon: (
        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
      )
    }
  ];

  const applications = [
    { id: "app_01", applicant: "Tina Evans", property: "Sunlit Loft near King Street", status: "Reviewing" },
    { id: "app_02", applicant: "Jared Lee", property: "Riverwalk Modern Condo", status: "Interview" },
    { id: "app_03", applicant: "Hailey Chen", property: "Southridge Garden Home", status: "Approved" }
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-brand-dark">Your landlord hub</h1>
          <p className="text-sm text-text-muted">
            Manage listings, review applications, and stay responsive to renters.
          </p>
        </div>
        <Link
          href={{ pathname: "/listings/new" }}
          className={buttonStyles({ variant: "primary", size: "md" })}
        >
          New listing
          <ArrowRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
        </Link>
      </header>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-dark">Your listings</h2>
          <Link
            href={{ pathname: "/dashboard/listings" }}
            className="text-sm font-semibold text-brand-blue transition hover:text-brand-teal"
          >
            Manage listings
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...activeListings, ...draftListings].map((property, index) => (
            <div key={`${property.id}-${index}`} className="space-y-3 rounded-3xl border border-black/5 bg-surface px-4 py-4">
              <p className="text-sm font-semibold text-brand-dark">{property.title}</p>
              <p className="text-xs text-text-muted">
                ${property.price.toLocaleString()} - {property.city}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    index < activeListings.length
                      ? "bg-brand-green/10 text-brand-green"
                      : "bg-brand-blue/10 text-brand-blue"
                  }`}
                >
                  {index < activeListings.length ? "Active" : "Draft"}
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
      </section>

      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-dark">Applications</h2>
          <Link
            href={{ pathname: "/dashboard/applications" }}
            className="text-sm font-semibold text-brand-blue transition hover:text-brand-teal"
          >
            See all
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-black/5">
          <table className="min-w-full divide-y divide-black/5 text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Applicant</th>
                <th scope="col" className="px-4 py-3">Property</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white">
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="px-4 py-3 font-semibold text-brand-dark">{application.applicant}</td>
                  <td className="px-4 py-3 text-text-muted">{application.property}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal">
                      {application.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{ pathname: "/dashboard/applications/[id]", query: { id: application.id } }}
                      className="text-xs font-semibold text-brand-blue transition hover:text-brand-teal"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
