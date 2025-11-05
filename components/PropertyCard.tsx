"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeModernIcon, MapPinIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import FavoriteButton from "@/components/ui/FavoriteButton";

import type { Property } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

type PropertyCardProps = {
  property: Property;
};

const typeLabels: Record<Property["type"], string> = {
  apartment: "Apartment",
  house: "House",
  condo: "Condo",
  townhouse: "Townhouse"
};

export default function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();
  const go = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    const target = property.slug ?? property.id;
    router.push(`/property/${target}`);
  };
  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`View ${property.title}`}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go(e);
        }
      }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-soft transition hover:-translate-y-1 focus:outline-none focus-ring"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {property.images[0] ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            loading="lazy"
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-muted text-sm text-text-muted">
            Image coming soon
          </div>
        )}
        {/* Favorite button (client) */}
        <FavoriteButton propertyId={property.id} />
        {property.verified && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-green shadow-soft">
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            Verified
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div>
          <p className="text-lg font-semibold text-textc">
            {formatCurrency(property.price)}
            <span className="ml-1 text-sm font-medium text-text-muted">/month</span>
          </p>
          <Link
            href={`/property/${property.slug ?? property.id}`}
            className="line-clamp-2 text-base font-semibold text-brand-dark transition hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            prefetch
          >
            {property.title}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-5 w-5 text-brand-blue" aria-hidden="true" />
            {property.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <HomeModernIcon className="h-5 w-5 text-brand-teal" aria-hidden="true" />
            {typeLabels[property.type]}
          </span>
          <Badge>{property.beds} beds</Badge>
          <Badge>{property.baths} baths</Badge>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-brand-teal">
          {property.pets && <Chip>Pet-friendly</Chip>}
          {property.furnished && <Chip>Furnished</Chip>}
          {!property.verified && <Chip className="text-brand-blue">New</Chip>}
        </div>
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-medium text-brand-teal">
      {children}
    </span>
  );
}

function Chip({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full bg-brand-teal/10 px-3 py-1 text-[0.7rem] font-semibold ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
