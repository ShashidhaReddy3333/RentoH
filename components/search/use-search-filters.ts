"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import {
  buildSearchHref,
  mergeFilters,
  parseSearchParams,
  serializeSearchFilters
} from "@/lib/search/params";
import type { Amenity, SearchFilterKey, SearchFilters } from "@/lib/search/types";

type UseSearchFiltersOptions = {
  defaults?: Partial<SearchFilters>;
};

export function useSearchFilters(options: UseSearchFiltersOptions = {}) {
  const { defaults = {} } = options;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo(() => {
    const parsed = parseSearchParams(searchParams);
    return mergeFilters(defaults, parsed, { dropUnset: true });
  }, [defaults, searchParams]);

  const pushFilters = useCallback(
    (next: SearchFilters) => {
      const href = buildSearchHref(pathname, next);
      router.replace(href as Route, { scroll: false });
    },
    [pathname, router]
  );

  const setFilters = useCallback(
    (updates: Partial<SearchFilters>) => {
      const next = mergeFilters(filters, updates, { dropUnset: true });
      pushFilters(next);
    },
    [filters, pushFilters]
  );

  const setFilter = useCallback(
    <K extends SearchFilterKey>(key: K, value: SearchFilters[K]) => {
      const updates = { [key]: value } as Partial<SearchFilters>;
      setFilters(updates);
    },
    [setFilters]
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname as Route, { scroll: false });
  }, [pathname, router]);

  const toQueryString = useCallback(() => serializeSearchFilters(filters), [filters]);

  const toggleAmenity = useCallback(
    (amenity: Amenity) => {
      const current = new Set(filters.amenities ?? []);
      if (current.has(amenity)) {
        current.delete(amenity);
      } else {
        current.add(amenity);
      }
      const nextAmenities = current.size ? Array.from(current) : undefined;
      setFilters({ amenities: nextAmenities });
    },
    [filters.amenities, setFilters]
  );

  return {
    filters,
    setFilter,
    setFilters,
    toggleAmenity,
    clearFilters,
    toQueryString,
    buildHref: (path = pathname) => buildSearchHref(path, filters)
  };
}
