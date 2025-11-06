import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getMany } from "@/lib/data-access/properties";
import type { PropertyFilters, PropertySort } from "@/lib/types";

export const revalidate = 60;
export const fetchCache = "force-cache";
export const dynamic = "force-dynamic";

const sortMap: Record<string, PropertySort> = {
  newest: "newest",
  "price-asc": "priceAsc",
  "price-desc": "priceDesc",
  priceAsc: "priceAsc",
  priceDesc: "priceDesc"
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const sortParam = searchParams.get("sort");
    const sort: PropertySort = sortParam ? sortMap[sortParam] ?? "newest" : "newest";

    const filters: PropertyFilters = {};

    const city = searchParams.get("city");
    if (city) filters.city = city;

    const min = parseNumber(searchParams.get("min"));
    if (min != null) filters.min = min;

    const max = parseNumber(searchParams.get("max"));
    if (max != null) filters.max = max;

    const beds = parseNumber(searchParams.get("beds"));
    if (beds != null) filters.beds = beds;

    const baths = parseNumber(searchParams.get("baths"));
    if (baths != null) filters.baths = baths;

    const type = searchParams.get("type");
    if (type === "apartment" || type === "house" || type === "condo" || type === "townhouse") {
      filters.type = type;
    }

    if (searchParams.get("pets") === "true") filters.pets = true;
    if (searchParams.get("furnished") === "true") filters.furnished = true;
    if (searchParams.get("verified") === "true") filters.verified = true;

    const amenities = searchParams.getAll("amenities");
    if (amenities.length) {
      filters.amenities = amenities.filter(Boolean);
    }

    const availableFrom = searchParams.get("availableFrom");
    if (availableFrom) filters.availableFrom = availableFrom;

    const neighborhood = searchParams.get("neighborhood");
    if (neighborhood) filters.neighborhood = neighborhood;

    const keywords = searchParams.get("keywords");
    if (keywords) filters.keywords = keywords;

    const result = await getMany(filters, sort, page);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch properties", error);
    return NextResponse.json({ error: "Failed to load properties" }, { status: 500 });
  }
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
