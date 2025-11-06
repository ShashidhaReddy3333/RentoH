import type { Metadata } from "next";
import { Suspense } from "react";

import BrowseClient from "@/app/browse/BrowseClient";
import { getMany } from "@/lib/data-access/properties";
import { env } from "@/lib/env";
import type { FiltersState } from "@/components/FiltersSheet";
import type { PropertyFilters, PropertySort, Property, PaginatedResult } from "@/lib/types";

// Enable server-side caching with 1 hour revalidation
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example";
  const url = `${siteUrl.replace(/\/$/, "")}/browse`;
  const title = "Browse Rental Homes & Apartments";
  const description =
    "Explore thousands of verified rental listings. Filter by price, bedrooms, amenities, pet-friendly options, and more. Find your perfect home today.";
  const imageUrl = `${siteUrl}/og-browse.png`;

  return {
    title,
    description,
    keywords: [
      "browse rentals",
      "rental search",
      "apartments",
      "houses for rent",
      "condos",
      "pet-friendly rentals",
      "furnished apartments",
      "verified listings"
    ],
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: "Rento",
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Browse Rental Homes on Rento"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@rento"
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1
      }
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

  // Stream search results as a server component using RSC
  const propertiesPromise = getMany(filters, sort, page);

  return (
    <Suspense fallback={<BrowseLoadingFallback filtersState={filtersState} view={view} />}>
      <BrowseResults
        propertiesPromise={propertiesPromise}
        filtersState={filtersState}
        filters={filters}
        sort={sort}
        page={page}
        view={view}
        filtersOpen={filtersOpen}
      />
    </Suspense>
  );
}

// Server component that uses the promise with use() API for streaming
async function BrowseResults({
  propertiesPromise,
  filtersState,
  filters,
  sort,
  page,
  view,
  filtersOpen
}: {
  propertiesPromise: Promise<PaginatedResult<Property>>;
  filtersState: FiltersState;
  filters: PropertyFilters;
  sort: PropertySort;
  page: number;
  view: "grid" | "map";
  filtersOpen: boolean;
}) {
  const result = await propertiesPromise;

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

// Loading fallback with skeleton UI
function BrowseLoadingFallback({ view }: { filtersState: FiltersState; view: "grid" | "map" }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-10">
      <div className="hidden lg:block">
        <div className="h-96 animate-pulse rounded-3xl bg-brand-light" />
      </div>
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-3xl bg-brand-light" />
        {view === "map" ? (
          <div className="h-[420px] animate-pulse rounded-3xl bg-brand-light" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-brand-light" />
            ))}
          </div>
        )}
      </div>
    </div>
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
