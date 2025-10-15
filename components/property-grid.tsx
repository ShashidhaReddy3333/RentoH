import CardGlass from "@/components/CardGlass";
import PropertyCard from "@/components/property-card";
import type { Property } from "@/lib/mock";

type PropertyGridProps = {
  properties: Property[];
  toggleFavorite?: (id: string) => void;
  favorites?: string[];
};

export default function PropertyGrid({
  properties,
  toggleFavorite,
  favorites = [],
}: PropertyGridProps) {
  if (!properties.length) {
    return (
      <CardGlass className="text-center">
        <div className="space-y-2 p-6">
          <p className="text-body text-brand-dark/70">
            No properties match your filters right now. Try adjusting your search or check back soon!
          </p>
        </div>
      </CardGlass>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onSave={toggleFavorite}
          saved={favorites.includes(property.id)}
        />
      ))}
    </div>
  );
}
