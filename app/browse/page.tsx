"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import PropertyGrid from "@/components/property-grid";
import SearchFilters from "@/components/search-filters";
import { PropertyFilter } from "@/lib/mock";
import { useAppState } from "@/components/providers/app-provider";

type FilterQuery = {
  city?: string;
  postalCode?: string;
  type?: string;
  min?: string;
  max?: string;
  furnished?: string;
};

function paramsToFilter(params: URLSearchParams): FilterQuery {
  const query: FilterQuery = {};
  params.forEach((value, key) => {
    if (value) query[key as keyof FilterQuery] = value;
  });
  return query;
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowseContent />
    </Suspense>
  );
}

function BrowseFallback() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-40 rounded bg-gray-200" />
      <div className="card space-y-2">
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filteredProperties, toggleFavorite, favorites } = useAppState();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PropertyFilter>(() => ({
    city: searchParams.get("city") ?? undefined,
    postalCode: searchParams.get("postalCode") ?? undefined,
    type: (searchParams.get("type") as PropertyFilter["type"]) ?? undefined,
    min: searchParams.get("min") ? Number(searchParams.get("min")) : undefined,
    max: searchParams.get("max") ? Number(searchParams.get("max")) : undefined,
    furnished:
      searchParams.get("furnished") === null
        ? undefined
        : searchParams.get("furnished") === "true"
  }));

  useEffect(() => {
    const incoming = paramsToFilter(searchParams);
    setFilters({
      city: incoming.city,
      postalCode: incoming.postalCode,
      type: incoming.type as PropertyFilter["type"] | undefined,
      min: incoming.min ? Number(incoming.min) : undefined,
      max: incoming.max ? Number(incoming.max) : undefined,
      furnished:
        incoming.furnished == null
          ? undefined
          : incoming.furnished === "true"
    });
  }, [searchParams]);

  const results = useMemo(() => filteredProperties(filters), [filters, filteredProperties]);

  const handleChange = (nextFilters: PropertyFilter) => {
    setFilters(nextFilters);
    const params = new URLSearchParams();
    if (nextFilters.city) params.set("city", nextFilters.city);
    if (nextFilters.postalCode) params.set("postalCode", nextFilters.postalCode);
    if (nextFilters.type) params.set("type", nextFilters.type);
    if (nextFilters.min != null) params.set("min", String(nextFilters.min));
    if (nextFilters.max != null) params.set("max", String(nextFilters.max));
    if (nextFilters.furnished != null) params.set("furnished", String(nextFilters.furnished));

    const search = params.toString();
    const href = (search ? `/browse?${search}` : "/browse") as Route;
    router.replace(href, { scroll: false });
  };

  const defaultValues = useMemo(
    () => ({
      city: filters.city ?? "",
      postalCode: filters.postalCode ?? "",
      type: filters.type ?? "",
      min: filters.min != null ? String(filters.min) : "",
      max: filters.max != null ? String(filters.max) : "",
      furnished:
        filters.furnished == null ? "" : filters.furnished ? "true" : "false"
    }),
    [filters]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-[var(--c-dark)]">Browse rentals</h1>
        <p className="text-sm text-gray-600">
          Filter by location, rent, and amenities to discover spaces tailored to your lifestyle.
        </p>
        <div className="flex items-center gap-3 md:hidden">
          <button
            className="btn btn-secondary flex-1"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
          <div className="text-xs text-gray-500">
            {results.length} {results.length === 1 ? "listing" : "listings"}
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[340px_1fr]">
        <div className={`space-y-4 ${showFilters ? "block" : "hidden md:block"}`}>
          <SearchFilters defaultValues={defaultValues} onChange={handleChange} />
          <aside className="card hidden md:block">
            <h2 className="text-base font-semibold text-[var(--c-dark)]">Tips</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Save your favorite listings to compare later.</li>
              <li>Toggle furnished filter to match your moving plans.</li>
              <li>Use the dashboard to manage landlord listings.</li>
            </ul>
          </aside>
        </div>
        <div className="space-y-4">
          <div className="hidden justify-between text-sm text-gray-500 md:flex">
            <span>{results.length} listings</span>
            <a className="text-[var(--c-blue)] hover:underline" href="#map-view">
              Map view coming soon
            </a>
          </div>
          <PropertyGrid
            properties={results}
            toggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        </div>
      </div>
    </div>
  );
}
