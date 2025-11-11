"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPinIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";

import type { Property } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

type PropertyCardProps = {
  property: Property;
  onToggleFavorite?: (isSaved: boolean) => void;
};

const typeLabels: Record<Property["type"], string> = {
  apartment: "Apartment",
  house: "House",
  condo: "Condo",
  townhouse: "Townhouse"
};

export default function PropertyCard({ property, onToggleFavorite }: PropertyCardProps) {
  const router = useRouter();
  const target = property.slug ?? property.id;
  const primaryImage = property.images[0];
  const priceLabel = formatCurrency(property.price);
  const detailHref = `/property/${target}` as const;

  const handleNavigate = (event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event) event.stopPropagation();
    router.push(detailHref);
  };

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`View details for ${property.title}`}
      onClick={() => handleNavigate()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate(event);
        }
      }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-outline/60 bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        {primaryImage ? (
          <ImageWithSkeleton
            src={primaryImage}
            alt={`Primary photo for ${property.title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Photo coming soon
          </div>
        )}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          {property.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-brand-success shadow-sm">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              Verified
            </span>
          ) : null}
          <FavoriteButton 
            propertyId={property.id} 
            initialSaved={Boolean(property.isFavorite)}
            onToggle={onToggleFavorite}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="space-y-2">
          <p className="text-xl font-semibold text-brand-dark">
            {priceLabel}
            <span className="ml-1 text-sm font-medium text-neutral-500">/month</span>
          </p>
          <Link
            href={detailHref}
            prefetch
            className="line-clamp-2 text-lg font-semibold text-brand-dark transition hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            onPointerEnter={() => router.prefetch(detailHref)}
            onFocusCapture={() => router.prefetch(detailHref)}
          >
            {property.title}
          </Link>
          <p className="flex items-center gap-1 text-sm text-neutral-600">
            <MapPinIcon className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            <span>{property.city}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <Badge variant="outline">{typeLabels[property.type]}</Badge>
          <Badge variant="muted">{property.beds} beds</Badge>
          <Badge variant="muted">{property.baths} baths</Badge>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 text-xs text-neutral-600">
          {property.pets ? (
            <span className="rounded-full bg-brand-primaryMuted px-3 py-1 font-medium text-brand-primary">
              Pet-friendly
            </span>
          ) : null}
          {property.furnished ? (
            <span className="rounded-full bg-brand-successMuted px-3 py-1 font-medium text-brand-success">
              Furnished
            </span>
          ) : null}
          {!property.verified ? (
            <span className="rounded-full bg-brand-warningMuted px-3 py-1 font-medium text-brand-dark">
              New listing
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-outline/60 bg-surface p-4 md:p-6">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton lines={2} />
      </div>
    </div>
  );
}
