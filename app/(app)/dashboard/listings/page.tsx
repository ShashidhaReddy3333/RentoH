import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import EmptyState from "@/components/EmptyState";
import PropertyCard from "@/components/PropertyCard";
import { buttonStyles } from "@/components/ui/button";
import { listOwnedProperties } from "@/lib/data-access/properties";
import { getCurrentUser } from "@/lib/data-access/profile";
import { hasSupabaseEnv } from "@/lib/env";

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeListings.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {draftListings.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white p-6 text-sm text-text-muted">
            No drafts waiting. Start a new listing to save progress as a draft.
          </div>
        )}
      </section>
    </div>
  );
}
