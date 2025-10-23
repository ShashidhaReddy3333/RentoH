import PropertyCard from "@/components/PropertyCard";
import { buttonStyles } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@/lib/types";

type PropertyGridProps = {
  properties: Property[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

export default function PropertyGrid({
  properties,
  loading = false,
  onLoadMore,
  hasMore = false
}: PropertyGridProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] rounded-3xl" />
            ))
          : properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
      </div>
      {onLoadMore && hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            className={buttonStyles({ variant: "outline", size: "md" })}
            data-testid="properties-load-more"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
