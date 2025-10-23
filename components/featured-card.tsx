"use client";

import clsx from "clsx";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListingSummary } from "@/lib/search/types";

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

type FeaturedCardProps = {
  listing: ListingSummary;
};

export function FeaturedCard({ listing }: FeaturedCardProps) {
  const location =
    [listing.city, listing.state, listing.postal_code].filter(Boolean).join(", ") ||
    "Location coming soon";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-dark/10 bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-surface">
      <div className="relative aspect-video w-full overflow-hidden bg-surface-muted">
        {listing.thumbnail_url ? (
          <div className="absolute inset-0">
            <ImageWithSkeleton
              src={listing.thumbnail_url}
              alt={`${listing.title} photo`}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            />
          </div>
        ) : (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        )}
        <span className="absolute right-3 top-3 rounded-full bg-brand-dark/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {formatRent(listing.rent)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-textc">{listing.title}</h3>
          <p className="text-sm text-text-muted">{location}</p>
        </div>
        <div className="mt-auto flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/listings/${listing.slug}`}
            className={clsx(buttonStyles({ variant: "primary" }), "w-full sm:flex-1")}
          >
            View details
          </Link>
          <Link
            href="/messages"
            className={clsx(buttonStyles({ variant: "outline" }), "w-full sm:flex-1")}
          >
            Message
          </Link>
        </div>
      </div>
    </article>
  );
}

function formatRent(amount: number) {
  return `${rentFormatter.format(amount)}/mo`;
}
