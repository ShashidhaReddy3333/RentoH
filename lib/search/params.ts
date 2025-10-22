import type { ReadonlyURLSearchParams } from "next/navigation";

import { type SearchFilters, amenityLabels } from "@/lib/search/types";

type ReadonlyParams = URLSearchParams | ReadonlyURLSearchParams;

const paramMap = {
  location: "q",
  priceMin: "minPrice",
  priceMax: "maxPrice",
  bedroomsMin: "beds",
  bathroomsMin: "baths",
  propertyTypes: "types",
  amenities: "amenities"
} as const;

const numberParams = new Set<string>([
  paramMap.priceMin,
  paramMap.priceMax,
  paramMap.bedroomsMin,
  paramMap.bathroomsMin
]);

const multiValueParams = new Set<string>([paramMap.propertyTypes, paramMap.amenities]);

const validAmenityKeys = new Set(Object.keys(amenityLabels));

export function serializeSearchFilters(filters: SearchFilters): string {
  const params = filtersToSearchParams(filters);
  const query = params.toString();
  return query;
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.location) {
    params.set(paramMap.location, filters.location.trim());
  }
  if (typeof filters.priceMin === "number") {
    params.set(paramMap.priceMin, filters.priceMin.toString());
  }
  if (typeof filters.priceMax === "number") {
    params.set(paramMap.priceMax, filters.priceMax.toString());
  }
  if (typeof filters.bedroomsMin === "number") {
    params.set(paramMap.bedroomsMin, filters.bedroomsMin.toString());
  }
  if (typeof filters.bathroomsMin === "number") {
    params.set(paramMap.bathroomsMin, filters.bathroomsMin.toString());
  }
  if (filters.propertyTypes?.length) {
    params.set(paramMap.propertyTypes, [...new Set(filters.propertyTypes)].join(","));
  }
  if (filters.amenities?.length) {
    params.set(paramMap.amenities, [...new Set(filters.amenities)].join(","));
  }

  return params;
}

export function parseSearchParams(params: ReadonlyParams | null | undefined): SearchFilters {
  if (!params) return {};

  const getAllEntries = (key: string) => params.getAll(key);
  const get = (key: string) => params.get(key);
  const has = (key: string) => params.has(key);

  const filters: SearchFilters = {};

  Object.values(paramMap).forEach((paramKey) => {
    if (!has(paramKey)) return;
    if (multiValueParams.has(paramKey)) {
      const entries =
        getAllEntries(paramKey)
          .join(",")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean) ?? [];

      if (!entries.length) return;

      const unique = [...new Set(entries)];

      if (paramKey === paramMap.amenities) {
        const filtered = unique.filter((key) => validAmenityKeys.has(key));
        if (filtered.length) {
          assign(filters, paramKey, filtered);
        }
        return;
      }

      assign(filters, paramKey, unique);
      return;
    }

    const value = get(paramKey);
    if (!value) return;

    if (numberParams.has(paramKey)) {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        assign(filters, paramKey, numeric);
      }
      return;
    }

    assign(filters, paramKey, value);
  });

  return filters;
}

export function mergeFilters(
  base: SearchFilters,
  updates: Partial<SearchFilters>,
  opts: { dropUnset?: boolean } = {}
): SearchFilters {
  const merged: SearchFilters = { ...base };
  Object.entries(updates).forEach(([key, value]) => {
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
      if (opts.dropUnset) {
        delete (merged as Record<string, unknown>)[key];
      } else {
        (merged as Record<string, unknown>)[key] = undefined;
      }
      return;
    }
    (merged as Record<string, unknown>)[key] = value;
  });
  return merged;
}

function assign(target: SearchFilters, paramKey: string, value: unknown) {
  switch (paramKey) {
    case paramMap.location:
      target.location = value as string;
      break;
    case paramMap.priceMin:
      target.priceMin = value as number;
      break;
    case paramMap.priceMax:
      target.priceMax = value as number;
      break;
    case paramMap.bedroomsMin:
      target.bedroomsMin = value as number;
      break;
    case paramMap.bathroomsMin:
      target.bathroomsMin = value as number;
      break;
    case paramMap.propertyTypes:
      target.propertyTypes = value as SearchFilters["propertyTypes"];
      break;
    case paramMap.amenities:
      target.amenities = value as SearchFilters["amenities"];
      break;
    default:
      break;
  }
}

export function buildSearchHref<Path extends string>(
  path: Path,
  filters: SearchFilters
): Path | `${Path}?${string}` {
  const query = serializeSearchFilters(filters);
  return (query ? `${path}?${query}` : path) as Path | `${Path}?${string}`;
}
