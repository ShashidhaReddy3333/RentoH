import type { Metadata } from "next";

import MapPane from "@/components/MapPane";
import PropertyGrid from "@/components/PropertyGrid";
import SearchClient from "./SearchClient";
import { getMany } from "@/lib/data-access/properties";
import { env } from "@/lib/env";
import type { PropertyFilters, PropertySort } from "@/lib/types";
import SortMenu from "@/components/SortMenu";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Search rentals - Rento";
  const description = "Search by neighborhood, amenities, available date and more.";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example";
  const url = `${siteUrl.replace(/\/$/, "")}/search`;

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

export default async function SearchPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parsePage(searchParams["page"]);
  const sort = parseSort(searchParams["sort"]);
  const filters = parseFilters(searchParams);
  const view = searchParams["view"] === "map" ? "map" : "grid";

  const result = await getMany(filters, sort, page);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white px-4 py-3 shadow-soft">
        <div className="text-sm text-text-muted">Search results</div>
        <div className="flex items-center gap-2">
          <SearchClient initialSort={sort} properties={result.items} />
        </div>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-md border border-black/5 bg-white p-6 text-sm text-text-muted">
          <p className="font-semibold">No results</p>
          <p className="mt-2">Try different keywords or remove filters to broaden your search.</p>
        </div>
      ) : view === "map" ? (
        <MapPane properties={result.items} />
      ) : (
        <PropertyGrid properties={result.items} hasMore={Boolean(result.nextPage)} />
      )}
    </div>
  );
}

function parsePage(param: unknown) {
  const value = Array.isArray(param) ? param[0] : (param as string | undefined);
  const parsed = Number(value ?? "1");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

const sortMap: Record<string, PropertySort> = {
  newest: "newest",
  "price-asc": "priceAsc",
  "price-desc": "priceDesc",
  priceAsc: "priceAsc",
  priceDesc: "priceDesc"
};

function parseSort(param: unknown): PropertySort {
  const value = Array.isArray(param) ? param[0] : (param as string | undefined);
  if (!value) return "newest";
  return sortMap[value] ?? "newest";
}

function parseFilters(searchParams: { [key: string]: string | string[] | undefined }): PropertyFilters {
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
    filters.type = type as any;
  }

  const pets = get("pets");
  if (pets === "true") filters.pets = true;

  const furnished = get("furnished");
  if (furnished === "true") filters.furnished = true;

  const verified = get("verified");
  if (verified === "true") filters.verified = true;

  const neighborhood = get("neighborhood");
  if (neighborhood) filters.neighborhood = neighborhood;

  const availableFrom = get("available_from");
  if (availableFrom) filters.availableFrom = availableFrom;

  const amenities = get("amenities");
  if (amenities) {
    filters.amenities = String(amenities)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const keywords = get("keywords");
  if (keywords) filters.keywords = keywords;

  return filters;
}

function toNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
