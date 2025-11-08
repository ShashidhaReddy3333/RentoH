import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import { listOwnedProperties } from "@/lib/data-access/properties";
import { getCurrentUser } from "@/lib/data-access/profile";
import { hasSupabaseEnv } from "@/lib/env";
import NewListingClient from "@/app/(app)/listings/new/NewListingClient";

type PageProps = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Edit listing - Rento",
  description: "Update pricing, photos, and availability for your rental."
};

export default async function EditListingPage({ params }: PageProps) {
  if (!hasSupabaseEnv) {
    return (
      <EmptyState
        title="Connect Supabase to edit listings"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to manage live listings."
      />
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  if (user.role !== "landlord" && user.role !== "admin") {
    redirect("/dashboard");
  }

  const ownedListings = await listOwnedProperties(100);
  const listing = ownedListings.find((property) => property.id === params.id);

  if (!listing) {
    return (
      <EmptyState
        title="Listing not found"
        description="The listing you are trying to edit could not be found. It may have been deleted."
        action={
          <Link href={{ pathname: "/dashboard/listings" }} className={buttonStyles({ variant: "primary", size: "md" })}>
            Back to listings
          </Link>
        }
      />
    );
  }

  const storagePaths = listing.imageStoragePaths ?? listing.images;
  const initialImages = storagePaths.map((key, index) => ({
    key,
    url: listing.images[index] ?? key,
    isCover: index === 0
  }));

  const initialValues = {
    title: listing.title,
    rent: listing.price,
    street: listing.address ?? "",
    city: listing.city ?? "",
    postalCode: listing.postalCode ?? "",
    propertyType: listing.type,
    beds: listing.beds,
    baths: listing.baths,
    area: listing.area ?? null,
    amenities: listing.amenities ?? [],
    pets: listing.pets,
    smoking: listing.smoking ?? null,
    parking: listing.parking ?? "",
    availableFrom: listing.availableFrom ?? null,
    rentFrequency: listing.rentFrequency ?? null,
    description: listing.description ?? ""
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Edit listing</h1>
        <p className="text-sm text-text-muted">
          Update details, reorder photos, or adjust availability. Changes go live immediately after you save.
        </p>
        <Link prefetch={false} href={{ pathname: "/dashboard/listings" }} className={buttonStyles({ variant: "ghost", size: "sm" })}>
          Back to listings
        </Link>
      </header>
      <NewListingClient mode="edit" listingId={listing.id} initialValues={initialValues} initialImages={initialImages} />
    </div>
  );
}
