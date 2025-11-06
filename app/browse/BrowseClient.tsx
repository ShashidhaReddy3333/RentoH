"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { AdjustmentsHorizontalIcon, MapIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import FiltersSheet, {
  FiltersContent,
  MOBILE_FILTERS_PANEL_ID,
  type FiltersState
} from "@/components/FiltersSheet";
import SortMenu from "@/components/SortMenu";
import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import { hasSupabaseEnv } from "@/lib/env";
import PropertyGrid from "@/components/PropertyGrid";
import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import type { Property, PropertyFilters, PropertySort } from "@/lib/types";

import { fetchMoreProperties } from "./actions";

// Lazy-load MapPane only when user switches to map view
const MapPane = dynamic(() => import("@/components/MapPane"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[420px] animate-pulse rounded-3xl bg-brand-light shadow-sm"
      role="status"
      aria-label="Loading map"
    />
  )
});

type BrowseClientProps = {
  initialProperties: Property[];
  initialFilters: FiltersState;
  queryFilters: PropertyFilters;
  sort: PropertySort;
  nextPage?: number;
  page: number;
  view: "grid" | "map";
  filtersOpen: boolean;
};

const defaultFilters: FiltersState = {
  city: "",
  min: null,
  max: null,
  beds: null,
  baths: null,
  type: "any",
  pets: false,
  furnished: false,
  verified: false
};

export default function BrowseClient({
  initialProperties,
  initialFilters,
  queryFilters,
  sort,
  nextPage,
  page,
  view,
  filtersOpen
}: BrowseClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [properties, setProperties] = useState(initialProperties);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [currentSort, setCurrentSort] = useState<PropertySort>(sort);
  const [currentView, setCurrentView] = useState<"grid" | "map">(view);
  const [nextPageState, setNextPageState] = useState<number | undefined>(nextPage);
  const [isSheetOpen, setIsSheetOpen] = useState(filtersOpen);
  const [isLoadingMore, startTransition] = useTransition();
  const prefetchedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    prefetchedIds.current.clear();
    setProperties(initialProperties);
    setFilters(initialFilters);
    setCurrentSort(sort);
    setCurrentView(view);
    setNextPageState(nextPage);
  }, [initialFilters, initialProperties, nextPage, page, sort, view]);

  useEffect(() => {
    properties.slice(0, 6).forEach((property) => {
      const detailTarget = property.slug ?? property.id;
      if (prefetchedIds.current.has(detailTarget)) return;
      prefetchedIds.current.add(detailTarget);
      router.prefetch(`/property/${detailTarget}` as Route);
    });
  }, [properties, router]);

  const appliedFilters = useMemo(() => queryFilters, [queryFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(appliedFilters).filter((value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== false;
    }).length;
  }, [appliedFilters]);

  const hasFiltersApplied = activeFiltersCount > 0;

  const handleApplyFilters = () => {
    const search = buildSearchParams(filters, currentSort, currentView);
    router.push(`${pathname}?${search.toString()}` as Route);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    const search = buildSearchParams(defaultFilters, currentSort, currentView);
    router.push(`${pathname}?${search.toString()}` as Route);
  };

  const handleSortChange = (value: PropertySort) => {
    setCurrentSort(value);
    const search = buildSearchParams(filters, value, currentView);
    router.push(`${pathname}?${search.toString()}` as Route);
  };

  const handleViewChange = (value: "grid" | "map") => {
    setCurrentView(value);
    const search = buildSearchParams(filters, currentSort, value);
    router.push(`${pathname}?${search.toString()}` as Route);
  };

  const handleLoadMore = () => {
    if (!nextPageState) return;
    startTransition(async () => {
      const result = await fetchMoreProperties(appliedFilters, currentSort, nextPageState);
      setProperties((prev) => [...prev, ...result.items]);
      setNextPageState(result.nextPage);
    });
  };

  const totalLoaded = properties.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-10">
      <div className="hidden lg:block">
        <FiltersContent
          idPrefix="filters-desktop"
          values={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
      </div>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-brand-outline/60 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              aria-controls={MOBILE_FILTERS_PANEL_ID}
              aria-expanded={isSheetOpen}
              aria-haspopup="dialog"
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden",
                hasFiltersApplied
                  ? "border-brand-primary bg-brand-primary text-white hover:bg-brand-primary/90"
                  : "border-brand-outline/70 bg-white text-brand-dark hover:border-brand-primary hover:text-brand-primary"
              )}
              data-testid="filters-toggle"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              Filters
              {hasFiltersApplied ? (
                <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-white/20 px-1 text-xs font-semibold text-white">
                  {activeFiltersCount}
                </span>
              ) : null}
            </button>
            <span
              className="text-sm font-medium text-brand-dark"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {hasFiltersApplied ? `${totalLoaded} results` : `Showing ${totalLoaded} homes`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SortMenu value={currentSort} onChange={handleSortChange} />
            <div className="inline-flex items-center rounded-full border border-brand-outline/60 bg-brand-light p-1 text-sm text-neutral-500">
              <ToggleButton
                icon={Squares2X2Icon}
                label="Grid"
                active={currentView === "grid"}
                onClick={() => handleViewChange("grid")}
              />
              <ToggleButton
                icon={MapIcon}
                label="Map"
                active={currentView === "map"}
                onClick={() => handleViewChange("map")}
              />
            </div>
          </div>
        </div>

        {!hasSupabaseEnv ? (
          <div>
            <SupabaseConfigBanner />
            {properties.length === 0 ? (
              <div className="rounded-2xl border border-brand-outline/60 bg-white p-6 text-sm text-neutral-600">
                <p className="font-semibold text-brand-dark">Showing safe placeholder data</p>
                <p className="mt-2">
                  Supabase is not configured so you may be viewing mocked listings.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className={buttonStyles({ variant: "secondary", size: "md" })}
                    data-testid="clear-filters"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            ) : currentView === "map" ? (
              <MapPane properties={properties} />
            ) : (
              <PropertyGrid
                properties={properties}
                onLoadMore={nextPageState ? handleLoadMore : undefined}
                hasMore={Boolean(nextPageState)}
                loading={isLoadingMore}
              />
            )}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            title="No homes match your filters"
            description="Try adjusting your criteria or explore all homes nearby."
            action={
              <button
                type="button"
                onClick={handleClearFilters}
                className={buttonStyles({ variant: "secondary", size: "md" })}
                data-testid="clear-filters"
              >
                Clear filters
              </button>
            }
          />
        ) : currentView === "map" ? (
          <MapPane properties={properties} />
        ) : (
          <PropertyGrid
            properties={properties}
            onLoadMore={nextPageState ? handleLoadMore : undefined}
            hasMore={Boolean(nextPageState)}
            loading={isLoadingMore}
          />
        )}
      </div>

      <FiltersSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        values={filters}
        onChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </div>
  );
}

function ToggleButton({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: typeof Squares2X2Icon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        active
          ? "bg-brand-primary text-white shadow-sm"
          : "text-neutral-600 hover:text-brand-primary"
      )}
      aria-pressed={active}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function buildSearchParams(
  filters: FiltersState,
  sort: PropertySort,
  view: "grid" | "map"
) {
  const search = new URLSearchParams();

  if (filters.city) search.set("city", filters.city);
  if (filters.min != null) search.set("min", String(filters.min));
  if (filters.max != null) search.set("max", String(filters.max));
  if (filters.beds != null) search.set("beds", String(filters.beds));
  if (filters.baths != null) search.set("baths", String(filters.baths));
  if (filters.type !== "any") search.set("type", filters.type);
  if (filters.pets) search.set("pets", "true");
  if (filters.furnished) search.set("furnished", "true");
  if (filters.verified) search.set("verified", "true");

  search.set("sort", sort);
  search.set("view", view);
  search.delete("filters");

  return search;
}


