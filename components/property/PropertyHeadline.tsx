import { MapPinIcon } from "@heroicons/react/24/solid";

import type { Property } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import FavoriteButton from "@/components/ui/FavoriteButton";

type PropertyHeadlineProps = {
  property: Property;
  isFavorite?: boolean;
};

export function PropertyHeadline({ property, isFavorite = false }: PropertyHeadlineProps) {
  const monthlyRent = formatCurrency(property.price);

  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-teal">
            {property.neighborhood ?? property.city}
          </p>
          <h1 className="text-3xl font-semibold text-brand-dark">{property.title}</h1>
          {property.address ? (
            <p className="inline-flex items-center gap-2 text-sm text-text-muted">
              <MapPinIcon className="h-4 w-4 text-brand-blue" aria-hidden="true" />
              <span>{property.address}</span>
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-dark">{monthlyRent}</p>
            <p className="text-sm font-medium text-text-muted">per month</p>
          </div>
          <div className="relative">
            <FavoriteButton propertyId={property.id} initialSaved={isFavorite} />
          </div>
        </div>
      </div>
      <dl className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
        <Fact label="Bedrooms" value={`${property.beds} ${property.beds === 1 ? "bedroom" : "bedrooms"}`} />
        <Fact label="Bathrooms" value={`${property.baths} ${property.baths === 1 ? "bathroom" : "bathrooms"}`} />
        {property.area ? <Fact label="Floor area" value={`${property.area} sq ft`} /> : null}
        {property.availableFrom ? (
          <Fact label="Available" value={new Date(property.availableFrom).toLocaleDateString()} />
        ) : null}
        {property.walkScore != null ? <Fact label="Walk score" value={String(property.walkScore)} /> : null}
        {property.transitScore != null ? (
          <Fact label="Transit score" value={String(property.transitScore)} />
        ) : null}
      </dl>
    </header>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-text-muted/70">{label}</dt>
      <dd className="font-semibold text-textc">{value}</dd>
    </div>
  );
}
