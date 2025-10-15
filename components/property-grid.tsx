import PropertyCard from "./property-card";
import { Property } from "@/lib/mock";

type PropertyGridProps = {
  properties: Property[];
  toggleFavorite?: (id: string) => void;
  favorites?: string[];
};

export default function PropertyGrid({
  properties,
  toggleFavorite,
  favorites = []
}: PropertyGridProps) {
  if (!properties.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
        No properties match your filters right now. Try adjusting your search or check back soon!
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
