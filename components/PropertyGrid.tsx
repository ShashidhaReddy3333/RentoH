import { memo } from "react";

import PropertyCard, { PropertyCardSkeleton } from "@/components/PropertyCard";
import { buttonStyles } from "@/components/ui/button";
import type { Property } from "@/lib/types";

type PropertyGridProps = {
  properties: Property[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

function PropertyGridComponent({
  properties,
  loading = false,
  onLoadMore,
  hasMore = false
}: PropertyGridProps) {
  const items = loading
    ? Array.from({ length: 6 }, (_, index) => (
        <div key={`skeleton-${index}`} className="h-full">
          <PropertyCardSkeleton />
        </div>
      ))
    : properties.map((property) => (
        <div key={property.id} className="h-full">
          <PropertyCard property={property} />
        </div>
      ));

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items}
      </div>
      {onLoadMore && hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            className={buttonStyles({ variant: "secondary", size: "md" })}
            data-testid="properties-load-more"
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default memo(PropertyGridComponent);
