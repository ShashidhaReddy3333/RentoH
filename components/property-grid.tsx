import { Card, CardContent } from '@/components/ui/card';
import PropertyCard from '@/components/property-card';
import type { Property } from '@/lib/mock';

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
      <Card className="border-2 border-dashed border-black/10 text-center text-textc/70 dark:border-white/10">
        <CardContent>
          No properties match your filters right now. Try adjusting your search or check back soon!
        </CardContent>
      </Card>
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
