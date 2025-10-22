import type { Metadata } from "next";

import { SearchView } from "@/components/search/search-view";
import { parseSearchParams } from "@/lib/search/params";
import { searchListings } from "@/lib/search/service";
import type { SearchFilters } from "@/lib/search/types";

export const metadata: Metadata = {
  title: "Search rentals | Rento Bridge",
  description:
    "Explore verified rental listings with advanced filters for price, bedrooms, bathrooms, property type, and amenities."
};

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SearchPage({ searchParams = {} }: SearchPageProps) {
  const params = toURLSearchParams(searchParams);
  const filters = parseSearchParams(params);
  let initialResult = await searchListings(filters);

  if (!initialResult) {
    initialResult = { items: [], total: 0, hasMore: false };
  }

  return (
    <main className="container mx-auto px-4 py-10 lg:py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Find your next rental
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Use advanced filters to narrow results by price, bedrooms, bathrooms, property type, and
          amenities. View matches on an interactive map in real time.
        </p>
      </header>
      <SearchView initialFilters={filters} initialResult={initialResult} />
    </main>
  );
}

function toURLSearchParams(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) {
          params.append(key, item);
        }
      });
      return;
    }
    if (value != null) {
      params.set(key, value);
    }
  });
  return params;
}
