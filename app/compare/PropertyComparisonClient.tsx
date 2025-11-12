"use client";

import { useEffect, useState } from "react";
import { usePropertyComparison, PropertyComparisonTable } from "@/components/property/PropertyComparison";
import type { Property } from "@/lib/types";

export function PropertyComparisonClient() {
  const { comparisonIds } = usePropertyComparison();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (comparisonIds.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    async function fetchProperties() {
      try {
        setLoading(true);
        const responses = await Promise.all(
          comparisonIds.map((id) =>
            fetch(`/api/properties/${id}`).then((res) => (res.ok ? res.json() : null))
          )
        );
        setProperties(responses.filter((p): p is Property => p !== null));
      } catch (error) {
        console.error("Failed to fetch properties for comparison:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [comparisonIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary/20 border-t-brand-primary" aria-label="Loading" />
      </div>
    );
  }

  return <PropertyComparisonTable properties={properties} />;
}
