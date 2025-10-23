"use client";

import clsx from "clsx";
import Link from "next/link";

import BadgeVerified from "@/components/badge-verified";
import { H3 } from "@/components/Heading";
import { buttonStyles } from "@/components/ui/button";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@/lib/mock";

type CardVariant = "default" | "plain";

type PropertyCardProps = {
  property: Property;
  onSave?: (id: string) => void;
  saved?: boolean;
  className?: string;
  variant?: CardVariant;
};

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export default function PropertyCard({
  property,
  onSave,
  saved,
  className,
  variant = "default"
}: PropertyCardProps) {
  const primaryImage = property.images[0];
  const isPlain = variant === "plain";

  return (
    <div
      className={clsx(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-brand-dark/10 bg-surface shadow-sm transition-colors dark:border-white/10 dark:bg-surface",
        !isPlain && "duration-200 hover:-translate-y-1 hover:shadow-lg",
        isPlain && "border-transparent bg-transparent shadow-none hover:translate-y-0 hover:shadow-none",
        className
      )}
    >
      <MediaSection
        primaryImage={primaryImage}
        title={property.title}
        verified={property.verified}
        saved={saved}
        rent={property.rent}
        disabledSave={!onSave}
        onSave={() => onSave?.(property.id)}
      />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <DetailsSection property={property} />
        <Actions propertyId={property.id} />
      </div>
    </div>
  );
}

function MediaSection({
  primaryImage,
  title,
  verified,
  saved,
  rent,
  disabledSave,
  onSave
}: {
  primaryImage?: string;
  title: string;
  verified?: boolean;
  saved?: boolean;
  rent: number;
  disabledSave?: boolean;
  onSave: () => void;
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-b-2xl bg-surface-muted">
      {primaryImage ? (
        <div className="absolute inset-0">
          <ImageWithSkeleton
            src={primaryImage}
            alt={`${title} photo`}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>
      ) : (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
      <div className="absolute left-3 top-3">{verified ? <BadgeVerified /> : null}</div>
      <span className="absolute right-3 top-3 rounded-full bg-brand-dark/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
        {formatRent(rent)}
      </span>
      <button
        type="button"
        className={clsx(
          "absolute right-3 top-16 inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-dark/15 bg-surface text-textc shadow-sm transition hover:border-brand-teal hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/20 sm:top-3 sm:right-16",
          saved && "border-brand-teal bg-brand-teal/10 text-brand-teal",
          disabledSave && "cursor-default opacity-60 hover:border-brand-dark/15 hover:text-textc"
        )}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved rentals" : "Save this rental"}
        onClick={disabledSave ? undefined : onSave}
        disabled={disabledSave}
      >
        <Icon
          name="heart"
          variant={saved ? "solid" : "outline"}
          className="h-5 w-5"
        />
      </button>
    </div>
  );
}

function DetailsSection({ property }: { property: Property }) {
  const location = [property.city, property.postalCode].filter(Boolean).join(", ");
  return (
    <div className="space-y-2">
      <H3 className="text-xl font-semibold text-textc">{property.title}</H3>
      <p className="text-sm text-text-muted">
        {location || "Location updating soon"}
      </p>
      <p className="text-base font-semibold text-textc">
        {formatRent(property.rent)}
      </p>
    </div>
  );
}

function Actions({ propertyId }: { propertyId: string }) {
  return (
    <div className="mt-auto flex flex-col gap-3 sm:flex-row">
      <Link
        href={`/listings/${propertyId}`}
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
  );
}

function formatRent(amount: number) {
  return `${rentFormatter.format(amount)}/mo`;
}
