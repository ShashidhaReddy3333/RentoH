import { z } from "zod";

import { properties as mockProperties } from "@/lib/mock";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type Amenity,
  type ListingSummary,
  type PropertyType,
  type SearchFilters,
  type SearchResult,
  amenityLabels,
  supportedPropertyTypes
} from "@/lib/search/types";

const filterSchema = z.object({
  location: z.string().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  bedroomsMin: z.number().min(0).optional(),
  bathroomsMin: z.number().min(0).optional(),
  propertyTypes: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional()
});

const propertyTypeSet = new Set(supportedPropertyTypes);
const amenityKeySet = new Set(Object.keys(amenityLabels));

export async function searchListings(filters: SearchFilters): Promise<SearchResult> {
  const safeFilters = sanitizeFilters(filters);

  if (!hasSupabaseEnv) {
    return searchMockListings(safeFilters);
  }

  try {
    const client = createSupabaseServerClient();

    let query = client
      .from("properties")
      .select(
        [
          "id",
          "title",
          "rent",
          "address",
          "city",
          "state",
          "postal_code",
          "neighborhood",
          "latitude",
          "longitude",
          "bedrooms",
          "bathrooms",
          "property_type",
          "square_feet",
          "amenities",
          "thumbnail_url",
          "landlord_id"
        ].join(","),
        { count: "exact" }
      )
      .eq("available", true)
      .order("created_at", { ascending: false })
      .limit(40);

    if (safeFilters.location) {
      const term = safeFilters.location;
      query = query.or(
        [
          `city.ilike.%${term}%`,
          `postal_code.ilike.%${term}%`,
          `neighborhood.ilike.%${term}%`,
          `address.ilike.%${term}%`
        ].join(",")
      );
    }

    if (typeof safeFilters.priceMin === "number") {
      query = query.gte("rent", safeFilters.priceMin);
    }
    if (typeof safeFilters.priceMax === "number") {
      query = query.lte("rent", safeFilters.priceMax);
    }
    if (typeof safeFilters.bedroomsMin === "number") {
      query = query.gte("bedrooms", safeFilters.bedroomsMin);
    }
    if (typeof safeFilters.bathroomsMin === "number") {
      query = query.gte("bathrooms", safeFilters.bathroomsMin);
    }
    if (safeFilters.propertyTypes?.length) {
      query = query.in("property_type", safeFilters.propertyTypes);
    }
    if (safeFilters.amenities?.length) {
      query = query.contains("amenities", safeFilters.amenities);
    }
    if (safeFilters.bounds) {
      query = query
        .gte("latitude", safeFilters.bounds.south)
        .lte("latitude", safeFilters.bounds.north)
        .gte("longitude", safeFilters.bounds.west)
        .lte("longitude", safeFilters.bounds.east);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const rows = ((data ?? []) as unknown) as Record<string, unknown>[];
    const listings = rows.map((row) => mapRowToListing(row));

    return {
      items: listings,
      total: count ?? listings.length,
      hasMore: typeof count === "number" ? count > listings.length : false
    };
  } catch (error) {
    console.error("[searchListings] failed to query Supabase", error);
    return { items: [], total: 0, hasMore: false };
  }
}

function sanitizeFilters(filters: SearchFilters): SearchFilters {
  const parsed = filterSchema.safeParse(filters);
  const data = parsed.success ? parsed.data : {};
  const safe: SearchFilters = {};

  if (data.location?.trim()) {
    safe.location = data.location.trim();
  }

  if (typeof data.priceMin === "number") {
    safe.priceMin = Math.max(0, Math.floor(data.priceMin));
  }
  if (typeof data.priceMax === "number") {
    safe.priceMax = Math.max(0, Math.floor(data.priceMax));
  }
  if (safe.priceMin != null && safe.priceMax != null && safe.priceMin > safe.priceMax) {
    const [min, max] = [safe.priceMax, safe.priceMin];
    safe.priceMin = min;
    safe.priceMax = max;
  }

  if (typeof data.bedroomsMin === "number") {
    safe.bedroomsMin = data.bedroomsMin;
  }
  if (typeof data.bathroomsMin === "number") {
    safe.bathroomsMin = data.bathroomsMin;
  }

  if (Array.isArray(data.propertyTypes) && data.propertyTypes.length) {
    const normalized = data.propertyTypes
      .map((type) => type.trim().toLowerCase())
      .filter((value): value is PropertyType => propertyTypeSet.has(value as PropertyType));
    if (normalized.length) {
      safe.propertyTypes = normalized;
    }
  }

  if (Array.isArray(data.amenities) && data.amenities.length) {
    const normalized = data.amenities
      .map((amenity) => amenity.trim().toLowerCase())
      .filter((value): value is Amenity => amenityKeySet.has(value));
    if (normalized.length) {
      safe.amenities = normalized;
    }
  }

  if (filters.bounds) {
    const { north, south, east, west } = filters.bounds;
    const values = [north, south, east, west];
    if (values.every((value) => typeof value === "number" && Number.isFinite(value))) {
      safe.bounds = { north, south, east, west };
    }
  }

  return safe;
}

function searchMockListings(filters: SearchFilters): SearchResult {
  const matches = mockProperties
    .filter((property) => {
      if (filters.location) {
        const needle = filters.location.toLowerCase();
        const text =
          `${property.city} ${property.postalCode} ${property.address ?? ""}`.toLowerCase();
        if (!text.includes(needle)) {
          return false;
        }
      }

      if (typeof filters.priceMin === "number" && property.rent < filters.priceMin) {
        return false;
      }
      if (typeof filters.priceMax === "number" && property.rent > filters.priceMax) {
        return false;
      }
      if (typeof filters.bedroomsMin === "number") {
        const bedroomsFromTitle = extractBedrooms(property.title);
        if (bedroomsFromTitle != null && bedroomsFromTitle < filters.bedroomsMin) {
          return false;
        }
      }
      if (typeof filters.bathroomsMin === "number") {
        // Mocked data does not have baths; skip check
      }
      if (filters.propertyTypes?.length && !filters.propertyTypes.includes(property.type)) {
        return false;
      }
      if (filters.amenities?.length) {
        const hasAll = filters.amenities.every((amenity) =>
          property.amenities.map((item) => toAmenityKey(item)).includes(amenity)
        );
        if (!hasAll) {
          return false;
        }
      }
      return true;
    })
    .map<ListingSummary>((item) => ({
      id: item.id,
      title: item.title,
      rent: item.rent,
      address: item.address ?? null,
      neighborhood: null,
      city: item.city,
      state: null,
      postal_code: item.postalCode,
      latitude: null,
      longitude: null,
      bedrooms: extractBedrooms(item.title),
      bathrooms: null,
      property_type: item.type ?? null,
      square_feet: null,
      amenities: item.amenities
        .map((amenity) => toAmenityKey(amenity))
        .filter((amenity): amenity is Amenity => Boolean(amenity)),
      thumbnail_url: item.images[0] ?? null,
      landlord_id: item.landlordId ?? null,
      slug: item.id
    }));

  return {
    items: matches,
    total: matches.length,
    hasMore: false
  };
}

function mapRowToListing(row: Record<string, unknown>): ListingSummary {
  return {
    id: String(row["id"]),
    slug: String(row["id"]),
    title: String(row["title"] ?? "Untitled"),
    rent:
      typeof row["rent"] === "number"
        ? (row["rent"] as number)
        : Number(row["rent"] ?? 0),
    address: (row["address"] as string | null) ?? null,
    neighborhood: (row["neighborhood"] as string | null) ?? null,
    city: (row["city"] as string | null) ?? null,
    state: (row["state"] as string | null) ?? null,
    postal_code: (row["postal_code"] as string | null) ?? null,
    latitude: toNumberOrNull(row["latitude"]),
    longitude: toNumberOrNull(row["longitude"]),
    bedrooms: toNumberOrNull(row["bedrooms"]),
    bathrooms: toNumberOrNull(row["bathrooms"]),
    property_type: (row["property_type"] as ListingSummary["property_type"]) ?? null,
    square_feet: toNumberOrNull(row["square_feet"]),
    amenities: Array.isArray(row["amenities"])
      ? (row["amenities"].filter(
          (amenity): amenity is Amenity =>
            typeof amenity === "string" && amenityKeySet.has(amenity)
        ) as Amenity[])
      : null,
    thumbnail_url: (row["thumbnail_url"] as string | null) ?? null,
    landlord_id: (row["landlord_id"] as string | null) ?? null
  };
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function extractBedrooms(title: string | undefined): number | null {
  if (!title) return null;
  const bedroomMatch = title.match(/(\d+)\s*bed/i);
  if (!bedroomMatch) return null;
  const parsed = Number(bedroomMatch[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function toAmenityKey(label: string): Amenity | null {
  const normalized = label.toLowerCase();
  if (normalized.includes("parking")) return "parking";
  if (normalized.includes("pet")) return "pet_friendly";
  if (normalized.includes("laundry")) return "in_unit_laundry";
  if (normalized.includes("air") || normalized.includes("ac")) return "air_conditioning";
  return null;
}
