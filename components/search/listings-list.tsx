import Image from "next/image";
import clsx from "clsx";

import type { ListingSummary } from "@/lib/search/types";

type ListingsListProps = {
  items: ListingSummary[];
  selectedId: string | null;
  onSelect: (listingId: string | null) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function ListingsList({
  items,
  selectedId,
  onSelect,
  isLoading = false,
  error,
  onRetry
}: ListingsListProps) {
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-8 text-red-700 dark:border-red-600/40 dark:bg-red-900/30 dark:text-red-200">
        <p className="text-sm font-medium">We couldn&apos;t load listings right now.</p>
        <p className="text-xs opacity-80">{error}</p>
        {onRetry ? (
          <button
            type="button"
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-red-500"
            onClick={() => onRetry()}
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/60 p-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          No listings match your filters yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-300">
          Adjust search criteria or clear filters to broaden your results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading && items.length === 0 ? (
        <SkeletonList />
      ) : (
        items.map((listing) => {
          const selected = listing.id === selectedId;
          return (
            <article
              key={listing.id}
              role="button"
              tabIndex={0}
              onMouseEnter={() => onSelect(listing.id)}
              onFocus={() => onSelect(listing.id)}
              onClick={() => onSelect(listing.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(listing.id);
                }
              }}
              className={clsx(
                "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow transition hover:border-brand.primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand.primary dark:border-slate-700 dark:bg-slate-900/60",
                selected && "border-brand.primary shadow-lg"
              )}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                {listing.thumbnail_url ? (
                  <Image
                    src={listing.thumbnail_url}
                    alt={listing.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                  />
                ) : null}
                {listing.property_type ? (
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                    {listing.property_type}
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {listing.title}
                  </h3>
                  <span className="text-base font-semibold text-brand.primary">
                    {formatPrice(listing.rent)}
                    <span className="text-xs font-medium text-slate-500"> /mo</span>
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {[listing.neighborhood, listing.city, listing.state]
                    .filter(Boolean)
                    .join(", ") || listing.address || "Address coming soon"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-300">
                  <span>{formatMetric(listing.bedrooms, "bd")}</span>
                  <span>{formatMetric(listing.bathrooms, "ba")}</span>
                  {listing.square_feet ? <span>{listing.square_feet} sqft</span> : null}
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}

function formatMetric(value: number | null, label: string) {
  if (value == null) return `— ${label}`;
  return `${removeTrailingZero(value)} ${label}`;
}

function removeTrailingZero(value: number) {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatPrice(value: number) {
  return `$${value.toLocaleString()}`;
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/40"
        >
          <div className="mb-4 aspect-[4/3] rounded-xl bg-slate-200/70 dark:bg-slate-700/60" />
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded bg-slate-200/80 dark:bg-slate-700/60" />
            <div className="h-3 w-1/2 rounded bg-slate-200/80 dark:bg-slate-700/60" />
            <div className="h-3 w-3/4 rounded bg-slate-200/80 dark:bg-slate-700/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
