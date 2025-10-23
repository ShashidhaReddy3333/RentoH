import { WifiIcon, SparklesIcon, HomeModernIcon, ShieldCheckIcon, BoltIcon } from "@heroicons/react/24/outline";

type PropertyAmenitiesProps = {
  amenities?: string[];
};

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="amenities-heading" className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div>
        <h2 id="amenities-heading" className="text-xl font-semibold text-brand-dark">
          Amenities
        </h2>
        <p className="text-sm text-text-muted">
          Included features for this home.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {amenities.map((amenity) => (
          <li key={amenity} className="flex items-start gap-3 rounded-2xl bg-brand-teal/5 p-4 text-sm text-textc">
            <AmenityIcon amenity={amenity} />
            <span>{amenity}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AmenityIcon({ amenity }: { amenity: string }) {
  const normalized = amenity.toLowerCase();
  if (normalized.includes("parking") || normalized.includes("garage")) {
    return <HomeModernIcon className="mt-0.5 h-5 w-5 text-brand-teal" aria-hidden="true" />;
  }
  if (normalized.includes("laundry") || normalized.includes("washer") || normalized.includes("dryer")) {
    return <SparklesIcon className="mt-0.5 h-5 w-5 text-brand-teal" aria-hidden="true" />;
  }
  if (normalized.includes("smart") || normalized.includes("security") || normalized.includes("entry")) {
    return <ShieldCheckIcon className="mt-0.5 h-5 w-5 text-brand-teal" aria-hidden="true" />;
  }
  if (normalized.includes("ev") || normalized.includes("electric")) {
    return <BoltIcon className="mt-0.5 h-5 w-5 text-brand-teal" aria-hidden="true" />;
  }
  if (normalized.includes("wifi") || normalized.includes("internet")) {
    return <WifiIcon className="mt-0.5 h-5 w-5 text-brand-teal" aria-hidden="true" />;
  }
  return <SparklesIcon className="mt-0.5 h-5 w-5 text-brand-teal" aria-hidden="true" />;
}
