import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import { listOwnedProperties } from "@/lib/data-access/properties";
import { getCurrentUser } from "@/lib/data-access/profile";
import { hasSupabaseEnv } from "@/lib/env";
import type { Property } from "@/lib/types";
import { DeleteListingButton } from "./DeleteListingButton";

export const metadata: Metadata = {
  title: "Manage Listings - Rento",
  description: "Review and publish the homes you have listed on Rento."
};

export default async function ManageListingsPage() {
  if (!hasSupabaseEnv) {
    return (
      <EmptyState
        title="Connect Supabase to manage listings"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load live landlord data."
      />
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        title="Sign in to manage your listings"
        description="Create, publish, and update your rental listings once you're signed in."
        action={
          <Link href={{ pathname: "/auth/sign-in" }} className={buttonStyles({ variant: "primary", size: "md" })}>
            Sign in
          </Link>
        }
      />
    );
  }

  if (user.role !== "landlord" && user.role !== "admin") {
    redirect("/dashboard");
  }

  const listings = await listOwnedProperties(24);
  const activeListings = listings.filter((listing) => listing.status !== "draft");
  const draftListings = listings.filter((listing) => listing.status === "draft");

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Manage listings</h1>
        <p className="text-sm text-text-muted">
          Publish new homes, review drafts, and keep your availability up to date for renters.
        </p>
        <div className="flex gap-3">
          <Link href={{ pathname: "/listings/new" }} className={buttonStyles({ variant: "primary", size: "md" })}>
            Add new listing
          </Link>
          <Link href={{ pathname: "/dashboard" }} className={buttonStyles({ variant: "ghost", size: "md" })}>
            Back to dashboard
          </Link>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-dark">Active listings</h2>
          <span className="text-sm text-text-muted">
            {activeListings.length} {activeListings.length === 1 ? "home" : "homes"} visible to renters
          </span>
        </div>
        {activeListings.length ? (
          <ListingGrid listings={activeListings} />
        ) : (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white p-6 text-sm text-text-muted">
            You don&apos;t have any live listings yet. Publish one to reach verified renters.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-dark">Drafts</h2>
          <span className="text-sm text-text-muted">
            {draftListings.length} {draftListings.length === 1 ? "draft" : "drafts"} saved
          </span>
        </div>
        {draftListings.length ? (
          <ListingGrid listings={draftListings} />
        ) : (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white p-6 text-sm text-text-muted">
            No drafts waiting. Start a new listing to save progress as a draft.
          </div>
        )}
      </section>
    </div>
  );
}

function ListingGrid({ listings }: { listings: Property[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

function ListingCard({ listing }: { listing: Property }) {
  const coverImage = listing.images[0] ?? null;
  const priceLabel = `$${listing.price.toLocaleString()}`;
  const status = listing.status === "draft" ? "Draft" : "Active";

  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-soft">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-text-muted">
            No photo yet
          </div>
        )}
        <span
          className={`absolute left-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            status === "Draft" ? "bg-brand-blue/10 text-brand-blue" : "bg-brand-green/10 text-brand-green"
          }`}
        >
          {status}
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-brand-dark">{listing.title}</h3>
        <p className="text-sm text-text-muted">{listing.city}</p>
        <p className="text-sm font-semibold text-brand-teal">
          {priceLabel} <span className="text-xs font-medium text-text-muted">/ {listing.rentFrequency ?? "monthly"}</span>
        </p>
        <p className="text-xs text-text-muted">
          {listing.beds} beds · {listing.baths} baths{listing.area ? ` · ${listing.area} sqft` : ""}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={{ pathname: `/dashboard/listings/${listing.id}` }}
          className={buttonStyles({ variant: "outline", size: "sm" })}
        >
          Edit
        </Link>
        <DeleteListingButton listingId={listing.id} listingTitle={listing.title} />
        <Link
          href={{ pathname: `/property/${listing.slug ?? listing.id}` }}
          className={buttonStyles({ variant: "ghost", size: "sm" })}
        >
          View
        </Link>
      </div>
    </article>
  );
}
