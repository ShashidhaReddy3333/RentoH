"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { AdjustmentsHorizontalIcon, MapIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import FiltersSheet, {
  FiltersContent,
  type FiltersState
} from "@/components/FiltersSheet";
import MapPane from "@/components/MapPane";
import PropertyGrid from "@/components/PropertyGrid";
import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import type { Property, PropertyFilters, PropertySort } from "@/lib/types";

import { fetchMoreProperties } from "./actions";

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

  useEffect(() => {
    setProperties(initialProperties);
    setFilters(initialFilters);
    setCurrentSort(sort);
    setCurrentView(view);
    setNextPageState(nextPage);
  }, [initialFilters, initialProperties, nextPage, page, sort, view]);

  const appliedFilters = useMemo(() => queryFilters, [queryFilters]);

  const hasFiltersApplied = useMemo(() => {
    return Object.values(appliedFilters).some((value) => value !== undefined);
  }, [appliedFilters]);

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
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
      <div className="hidden lg:block">
        <FiltersContent
          values={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
      </div>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-black/5 bg-white px-4 py-3 shadow-soft">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-brand-teal/30 px-3 py-2 text-sm font-semibold text-brand-teal transition hover:border-brand-teal hover:bg-brand-teal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal md:hidden"
              data-testid="filters-toggle"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              Filters
            </button>
            {hasFiltersApplied ? (
              <span>{totalLoaded} results</span>
            ) : (
              <span>Showing {totalLoaded} homes</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
              Sort
              <select
                value={currentSort}
                onChange={(event) => handleSortChange(event.target.value as PropertySort)}
                className="rounded-full border border-black/5 bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
                data-testid="sort-select"
              >
                <option value="newest">Newest</option>
                <option value="priceAsc">Price (Low to High)</option>
                <option value="priceDesc">Price (High to Low)</option>
              </select>
            </label>
            <div className="inline-flex items-center rounded-full border border-black/5 bg-surface p-1 text-sm text-text-muted">
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

        {properties.length === 0 ? (
          <EmptyState
            title="No homes match your filters"
            description="Try adjusting your criteria or explore all homes nearby."
            action={
              <button
                type="button"
                onClick={handleClearFilters}
                className={buttonStyles({ variant: "outline", size: "md" })}
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
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal ${
        active ? "bg-brand-teal text-white shadow-soft" : "text-text-muted"
      }`}
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
