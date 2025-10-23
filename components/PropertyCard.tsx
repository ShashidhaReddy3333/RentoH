import Image from "next/image";
import Link from "next/link";
import {
  HeartIcon,
  HomeModernIcon,
  MapPinIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/solid";

import type { Property } from "@/lib/types";

type PropertyCardProps = {
  property: Property;
};

const typeLabels: Record<Property["type"], string> = {
  apartment: "Apartment",
  house: "House",
  condo: "Condo"
};

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-soft transition hover:-translate-y-1">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {property.images[0] ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-muted text-sm text-text-muted">
            Image coming soon
          </div>
        )}
        <button
          type="button"
          aria-label="Save listing"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-teal shadow-soft transition hover:bg-white"
          data-testid="property-save"
        >
          <HeartIcon className="h-5 w-5" aria-hidden="true" />
        </button>
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
            ${property.price.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-text-muted">/month</span>
          </p>
          <Link
            href={`/property/${property.id}`}
            className="line-clamp-2 text-base font-semibold text-brand-dark transition hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
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
