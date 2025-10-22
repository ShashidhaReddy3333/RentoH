"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import type { Amenity, SearchFilters } from "@/lib/search/types";
import { amenityLabels } from "@/lib/search/types";

type FiltersPanelProps = {
  filters: SearchFilters;
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  setFilters: (updates: Partial<SearchFilters>) => void;
  toggleAmenity: (amenity: Amenity) => void;
  clearFilters: () => void;
};

const PRICE_MIN = 500;
const PRICE_MAX = 6500;
const PRICE_STEP = 50;

const bedroomOptions = [
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 }
] as const;

const bathroomOptions = [
  { label: "1+", value: 1 },
  { label: "1.5+", value: 1.5 },
  { label: "2+", value: 2 }
] as const;

const propertyTypeOptions = [
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Condo", value: "condo" }
] as const;

const amenityOptions: Amenity[] = ["parking", "pet_friendly", "in_unit_laundry", "air_conditioning"];

export function FiltersPanel({
  filters,
  setFilter,
  setFilters,
  toggleAmenity,
  clearFilters
}: FiltersPanelProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceMin ?? PRICE_MIN,
    filters.priceMax ?? PRICE_MAX
  ]);
  const priceRangeRef = useRef<[number, number]>([
    filters.priceMin ?? PRICE_MIN,
    filters.priceMax ?? PRICE_MAX
  ]);
  const [locationValue, setLocationValue] = useState(filters.location ?? "");
  const debounceRef = useRef<number | undefined>();

  useEffect(() => {
    const next: [number, number] = [
      filters.priceMin ?? PRICE_MIN,
      filters.priceMax ?? PRICE_MAX
    ];
    setPriceRange(next);
    priceRangeRef.current = next;
  }, [filters.priceMin, filters.priceMax]);

  useEffect(() => {
    setLocationValue(filters.location ?? "");
  }, [filters.location]);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      const cleaned = locationValue.trim();
      const normalized = cleaned.length ? cleaned : undefined;
      if (normalized === filters.location) return;
      setFilter("location", normalized);
    }, 350);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [locationValue, filters.location, setFilter]);

  const activeBadges = useMemo(() => {
    const items: { label: string; onRemove: () => void }[] = [];
    if (filters.priceMin || filters.priceMax) {
      items.push({
        label: `Price: ${formatPrice(filters.priceMin)} - ${formatPrice(filters.priceMax)}`,
        onRemove: () => setFilters({ priceMin: undefined, priceMax: undefined })
      });
    }
    if (filters.bedroomsMin) {
      items.push({
        label: `${filters.bedroomsMin}+ beds`,
        onRemove: () => setFilter("bedroomsMin", undefined)
      });
    }
    if (filters.bathroomsMin) {
      items.push({
        label: `${filters.bathroomsMin}+ baths`,
        onRemove: () => setFilter("bathroomsMin", undefined)
      });
    }
    if (filters.propertyTypes?.length) {
      items.push({
        label: `Type: ${filters.propertyTypes.map(capitalizeWord).join(", ")}`,
        onRemove: () => setFilter("propertyTypes", undefined)
      });
    }
    if (filters.amenities?.length) {
      items.push({
        label: `Amenities: ${filters.amenities.map((amenity) => amenityLabels[amenity]).join(", ")}`,
        onRemove: () => setFilter("amenities", undefined)
      });
    }
    return items;
  }, [filters, setFilter, setFilters]);

  const handlePriceChange = (index: 0 | 1, value: number) => {
    setPriceRange((prev) => {
      const next: [number, number] = [...prev] as [number, number];
      next[index] = value;
      if (index === 0 && next[0] > next[1]) {
        next[0] = next[1];
      }
      if (index === 1 && next[1] < next[0]) {
        next[1] = next[0];
      }
      priceRangeRef.current = next;
      return next;
    });
  };

  const commitPriceRange = (range: [number, number]) => {
    setFilters({ priceMin: range[0], priceMax: range[1] });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="filter-location" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Location
            </label>
            <input
              id="filter-location"
              type="search"
              value={locationValue}
              placeholder="City, postal code, or neighborhood"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-brand.primary focus:border-brand.primary focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              onChange={(event) => setLocationValue(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Price range (monthly)
            </span>
            <div>
              <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
              <div className="relative mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={priceRange[0]}
                  aria-label="Minimum price"
                  onChange={(event) => handlePriceChange(0, Number(event.target.value))}
                  onPointerUp={() => commitPriceRange(priceRangeRef.current)}
                  onTouchEnd={() => commitPriceRange(priceRangeRef.current)}
                  onMouseUp={() => commitPriceRange(priceRangeRef.current)}
                  className="h-2 w-full appearance-none rounded-full bg-slate-200 accent-brand.primary"
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={priceRange[1]}
                  aria-label="Maximum price"
                  onChange={(event) => handlePriceChange(1, Number(event.target.value))}
                  onPointerUp={() => commitPriceRange(priceRangeRef.current)}
                  onTouchEnd={() => commitPriceRange(priceRangeRef.current)}
                  onMouseUp={() => commitPriceRange(priceRangeRef.current)}
                  className="h-2 w-full appearance-none rounded-full bg-slate-200 accent-brand.primary"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Property type
            </span>
            <div className="flex flex-wrap gap-2">
              {propertyTypeOptions.map((option) => {
                const selected = filters.propertyTypes?.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={clsx(
                      "rounded-full border px-3 py-1 text-sm font-medium transition",
                      selected
                        ? "border-brand.primary bg-brand.primary/10 text-brand.primary"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand.primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    )}
                    onClick={() => {
                      const current = new Set(filters.propertyTypes ?? []);
                      if (selected) {
                        current.delete(option.value);
                      } else {
                        current.add(option.value);
                      }
                      const next = current.size ? Array.from(current) : undefined;
                      setFilter("propertyTypes", next as SearchFilters["propertyTypes"]);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Bedrooms
            </span>
            <div className="flex flex-wrap gap-2">
              {bedroomOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-1 text-sm font-medium transition",
                    filters.bedroomsMin === option.value
                      ? "border-brand.primary bg-brand.primary/10 text-brand.primary"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand.primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  )}
                  onClick={() =>
                    setFilter(
                      "bedroomsMin",
                      filters.bedroomsMin === option.value ? undefined : option.value
                    )
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Bathrooms
            </span>
            <div className="flex flex-wrap gap-2">
              {bathroomOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-1 text-sm font-medium transition",
                    filters.bathroomsMin === option.value
                      ? "border-brand.primary bg-brand.primary/10 text-brand.primary"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand.primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  )}
                  onClick={() =>
                    setFilter(
                      "bathroomsMin",
                      filters.bathroomsMin === option.value ? undefined : option.value
                    )
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Amenities
            </span>
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map((amenity) => {
                const selected = filters.amenities?.includes(amenity) ?? false;
                return (
                  <button
                    key={amenity}
                    type="button"
                    className={clsx(
                      "rounded-full border px-3 py-1 text-sm font-medium transition",
                      selected
                        ? "border-brand.primary bg-brand.primary/10 text-brand.primary"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand.primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    )}
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenityLabels[amenity]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {activeBadges.length ? (
              activeBadges.map((badge) => (
                <span
                  key={badge.label}
                  className="inline-flex items-center gap-1 rounded-full bg-brand.primary/10 px-3 py-1 text-xs font-medium text-brand.primary"
                >
                  {badge.label}
                  <button
                    type="button"
                    className="text-brand.primary transition hover:text-brand.primary/80"
                    onClick={badge.onRemove}
                    aria-label={`Remove ${badge.label}`}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">No filters applied</span>
            )}
          </div>
          <button
            type="button"
            className="text-sm font-medium text-brand.blue transition hover:text-brand.primary"
            onClick={() => clearFilters()}
          >
            Clear all filters
          </button>
        </div>
      </div>
    </section>
  );
}

function formatPrice(value?: number) {
  if (value == null) return "$—";
  return `$${value.toLocaleString()}`;
}

function capitalizeWord(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
