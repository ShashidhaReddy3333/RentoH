import type { Metadata } from "next";

import BrowseClient from "@/app/browse/BrowseClient";
import { getMany } from "@/lib/data-access/properties";
import { env } from "@/lib/env";
import type { FiltersState } from "@/components/FiltersSheet";
import type { PropertyFilters, PropertySort } from "@/lib/types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example";
  const url = `${siteUrl.replace(/\/$/, "")}/browse`;
  const title = "Browse rentals - Rento";
  const description =
    "Filter by price, amenities, and verification status to discover your next rental.";

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Rento",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

type SearchParams = { [key: string]: string | string[] | undefined };

const sortMap: Record<string, PropertySort> = {
  newest: "newest",
  "price-asc": "priceAsc",
  "price-desc": "priceDesc",
  priceAsc: "priceAsc",
  priceDesc: "priceDesc"
};

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePage(searchParams["page"]);
  const sort = parseSort(searchParams["sort"]);
  const filters = parseFilters(searchParams);
  const filtersState = convertToFiltersState(filters);
  const view = searchParams["view"] === "map" ? "map" : "grid";
  const filtersOpen = searchParams["filters"] === "open";

  const result = await getMany(filters, sort, page);

  return (
    <BrowseClient
      initialProperties={result.items}
      initialFilters={filtersState}
      queryFilters={filters}
      sort={sort}
      nextPage={result.nextPage}
      page={page}
      view={view}
      filtersOpen={filtersOpen}
    />
  );
}

function parsePage(param: SearchParams["page"]) {
  const value = Array.isArray(param) ? param[0] : param;
  const parsed = Number(value ?? "1");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function parseSort(param: SearchParams["sort"]): PropertySort {
  const value = Array.isArray(param) ? param[0] : param;
  if (!value) return "newest";
  return sortMap[value] ?? "newest";
}

function parseFilters(searchParams: SearchParams): PropertyFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters: PropertyFilters = {};

  const city = get("city");
  if (city) filters.city = city;

  const min = toNumber(get("min"));
  if (min != null) filters.min = min;

  const max = toNumber(get("max"));
  if (max != null) filters.max = max;

  const beds = toNumber(get("beds"));
  if (beds != null) filters.beds = beds;

  const baths = toNumber(get("baths"));
  if (baths != null) filters.baths = baths;

  const type = get("type");
  if (type === "apartment" || type === "house" || type === "condo") {
    filters.type = type;
  }

  const pets = get("pets");
  if (pets === "true") filters.pets = true;

  const furnished = get("furnished");
  if (furnished === "true") filters.furnished = true;

  const verified = get("verified");
  if (verified === "true") filters.verified = true;

  return filters;
}

function convertToFiltersState(filters: PropertyFilters): FiltersState {
  return {
    city: filters.city ?? "",
    min: filters.min ?? null,
    max: filters.max ?? null,
    beds: filters.beds ?? null,
    baths: filters.baths ?? null,
    type: filters.type ?? "any",
    pets: Boolean(filters.pets),
    furnished: Boolean(filters.furnished),
    verified: Boolean(filters.verified)
  };
}

function toNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
