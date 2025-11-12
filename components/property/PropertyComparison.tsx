"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { XMarkIcon, HomeIcon, CheckIcon } from "@heroicons/react/24/outline";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

const COMPARISON_STORAGE_KEY = "rento_property_comparison";
const MAX_COMPARISON = 3;

export function usePropertyComparison() {
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
    if (stored) {
      try {
        setComparisonIds(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const addToComparison = (propertyId: string) => {
    const updated = [...new Set([...comparisonIds, propertyId])].slice(0, MAX_COMPARISON);
    setComparisonIds(updated);
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(updated));
  };

  const removeFromComparison = (propertyId: string) => {
    const updated = comparisonIds.filter((id) => id !== propertyId);
    setComparisonIds(updated);
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(updated));
  };

  const clearComparison = () => {
    setComparisonIds([]);
    localStorage.removeItem(COMPARISON_STORAGE_KEY);
  };

  const isInComparison = (propertyId: string) => comparisonIds.includes(propertyId);
  const canAddMore = comparisonIds.length < MAX_COMPARISON;

  return {
    comparisonIds,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAddMore,
    count: comparisonIds.length
  };
}

type ComparisonButtonProps = {
  propertyId: string;
  className?: string;
};

export function ComparisonButton({ propertyId, className = "" }: ComparisonButtonProps) {
  const { isInComparison, addToComparison, removeFromComparison, canAddMore } = usePropertyComparison();
  const isAdded = isInComparison(propertyId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdded) {
      removeFromComparison(propertyId);
    } else if (canAddMore) {
      addToComparison(propertyId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isAdded && !canAddMore}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition 
        ${
          isAdded
            ? "border-brand-teal bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20"
            : "border-brand-outline/60 bg-surface text-textc hover:border-brand-teal hover:text-brand-teal"
        }
        ${!isAdded && !canAddMore ? "cursor-not-allowed opacity-50" : ""}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40 focus-visible:ring-offset-2
        ${className}`}
      aria-label={isAdded ? "Remove from comparison" : "Add to comparison"}
    >
      {isAdded ? (
        <>
          <CheckIcon className="h-4 w-4" aria-hidden="true" />
          <span>Added</span>
        </>
      ) : (
        <>
          <HomeIcon className="h-4 w-4" aria-hidden="true" />
          <span>Compare</span>
        </>
      )}
    </button>
  );
}

type PropertyComparisonProps = {
  properties: Property[];
};

export function PropertyComparisonTable({ properties }: PropertyComparisonProps) {
  const { removeFromComparison, clearComparison } = usePropertyComparison();

  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-outline/40 bg-surface p-8 text-center">
        <HomeIcon className="mx-auto h-12 w-12 text-text-muted" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-brand-dark">No properties to compare</p>
        <p className="mt-1 text-sm text-text-muted">
          Add properties from the browse page to start comparing features, pricing, and amenities.
        </p>
        <Link
          href="/browse"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2"
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  const features = [
    { label: "Price", key: "price", format: (p: Property) => `${formatCurrency(p.price)}/mo` },
    { label: "Bedrooms", key: "beds", format: (p: Property) => `${p.beds} beds` },
    { label: "Bathrooms", key: "baths", format: (p: Property) => `${p.baths} baths` },
    { label: "Property Type", key: "type", format: (p: Property) => p.type },
    { label: "City", key: "city", format: (p: Property) => p.city },
    { label: "Pet-Friendly", key: "pets", format: (p: Property) => (p.pets ? "Yes" : "No") },
    { label: "Furnished", key: "furnished", format: (p: Property) => (p.furnished ? "Yes" : "No") },
    { label: "Verified", key: "verified", format: (p: Property) => (p.verified ? "Yes" : "No") }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-dark">Property Comparison</h2>
        <Button variant="ghost" size="sm" onClick={clearComparison}>
          Clear All
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-outline/40 bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-outline/40 bg-surface-muted">
              <th className="sticky left-0 z-10 bg-surface-muted px-4 py-3 font-semibold text-brand-dark">
                Feature
              </th>
              {properties.map((property) => (
                <th key={property.id} className="relative px-4 py-3">
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-video w-48 overflow-hidden rounded-lg">
                      {property.images[0] ? (
                        <ImageWithSkeleton
                          src={property.images[0]}
                          alt={property.title}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/property/${property.slug ?? property.id}`}
                        className="line-clamp-2 font-semibold text-brand-dark hover:text-brand-primary"
                      >
                        {property.title}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeFromComparison(property.id)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-sm transition hover:bg-danger hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
                      aria-label="Remove from comparison"
                    >
                      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-outline/40">
            {features.map((feature) => (
              <tr key={feature.key} className="hover:bg-surface-muted/50">
                <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-brand-dark">
                  {feature.label}
                </td>
                {properties.map((property) => (
                  <td key={property.id} className="px-4 py-3 text-textc">
                    {feature.format(property)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
