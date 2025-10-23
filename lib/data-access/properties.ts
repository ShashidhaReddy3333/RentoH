import { hasSupabaseEnv } from "@/lib/env";
import { mockProperties } from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PaginatedResult,
  Property,
  PropertyFilters,
  PropertySort
} from "@/lib/types";

const PAGE_SIZE = 12;

type SupabasePropertyRow = {
  id: string;
  title: string;
  price: number;
  beds: number;
  baths: number;
  type: Property["type"];
  city: string;
  verified?: boolean | null;
  pets?: boolean | null;
  furnished?: boolean | null;
  images?: string[] | string | null;
  created_at?: string | null;
  address?: string | null;
  description?: string | null;
  amenities?: string[] | string | null;
  area?: number | null;
  available_from?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  walk_score?: number | null;
  transit_score?: number | null;
  walkthrough_video_url?: string | null;
};

const PROPERTY_COLUMNS = `
  id,
  title,
  price,
  beds,
  baths,
  type,
  city,
  verified,
  pets,
  furnished,
  images,
  created_at,
  address,
  description,
  amenities,
  area,
  available_from,
  neighborhood,
  latitude,
  longitude,
  walk_score,
  transit_score,
  walkthrough_video_url
`;

export async function getFeatured(): Promise<Property[]> {
  if (hasSupabaseEnv) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("properties")
        .select(PROPERTY_COLUMNS)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        return data.map(mapPropertyFromSupabase);
      }
    } catch (error) {
      console.warn("[properties] Falling back to mock featured listings", error);
    }
  }

  return [...mockProperties]
    .sort((a, b) => {
      if (a.verified === b.verified) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.verified ? -1 : 1;
    })
    .slice(0, 6);
}

async function fetchManyFromSupabase(
  filters: PropertyFilters,
  sort: PropertySort,
  page: number
): Promise<PaginatedResult<Property>> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("properties")
    .select(PROPERTY_COLUMNS, { count: "exact" });

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }

  if (filters.beds != null) {
    query = query.gte("beds", filters.beds);
  }

  if (filters.baths != null) {
    query = query.gte("baths", filters.baths);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.pets != null) {
    query = query.eq("pets", filters.pets);
  }

  if (filters.furnished != null) {
    query = query.eq("furnished", filters.furnished);
  }

  if (filters.verified != null) {
    query = query.eq("verified", filters.verified);
  }

  if (filters.min != null) {
    query = query.gte("price", filters.min);
  }

  if (filters.max != null) {
    query = query.lte("price", filters.max);
  }

  query = applySortToQuery(query, sort);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await query.range(from, to);

  if (error || !data) {
    throw error ?? new Error("Failed to load properties");
  }

  const items = data.map(mapPropertyFromSupabase);
  const totalCount = typeof count === "number" ? count : undefined;
  const hasNext = totalCount != null ? to + 1 < totalCount : items.length === PAGE_SIZE;
  return { items, nextPage: hasNext ? page + 1 : undefined };
}

export async function getMany(
  filters: PropertyFilters = {},
  sort: PropertySort = "newest",
  page = 1
): Promise<PaginatedResult<Property>> {
  if (hasSupabaseEnv) {
    try {
      return await fetchManyFromSupabase(filters, sort, page);
    } catch (error) {
      console.warn("[properties] Falling back to mock listings", error);
    }
  }

  const filtered = applyFilters(mockProperties, filters);
  const sorted = applySort(filtered, sort);
  const paged = paginate(sorted, page);

  return paged;
}

function mapPropertyFromSupabase(record: SupabasePropertyRow): Property {
  return {
    id: record.id,
    title: record.title,
    images: toStringArray(record.images),
    price: record.price,
    beds: record.beds,
    baths: record.baths,
    type: record.type,
    city: record.city,
    verified: Boolean(record.verified),
    pets: Boolean(record.pets),
    furnished: Boolean(record.furnished),
    createdAt: record.created_at ?? new Date().toISOString(),
    address: record.address ?? undefined,
    description: record.description ?? undefined,
    amenities: toStringArray(record.amenities),
    area: record.area ?? undefined,
    availableFrom: record.available_from ?? undefined,
    neighborhood: record.neighborhood ?? undefined,
    coordinates:
      typeof record.latitude === "number" && typeof record.longitude === "number"
        ? { lat: record.latitude, lng: record.longitude }
        : undefined,
    walkScore: record.walk_score ?? undefined,
    transitScore: record.transit_score ?? undefined,
    walkthroughVideoUrl: record.walkthrough_video_url ?? undefined
  };
}

function applyFilters(properties: Property[], filters: PropertyFilters) {
  return properties.filter((property) => {
    if (filters.city) {
      const cityMatch = property.city.toLowerCase().includes(filters.city.toLowerCase());
      if (!cityMatch) return false;
    }

    if (filters.min != null && property.price < filters.min) return false;
    if (filters.max != null && property.price > filters.max) return false;

    if (filters.beds != null && property.beds < filters.beds) return false;
    if (filters.baths != null && property.baths < filters.baths) return false;

    if (filters.type && property.type !== filters.type) return false;

    if (filters.pets != null && property.pets !== filters.pets) return false;
    if (filters.furnished != null && property.furnished !== filters.furnished) return false;
    if (filters.verified != null && property.verified !== filters.verified) return false;

    return true;
  });
}

function applySort(properties: Property[], sort: PropertySort) {
  const sorted = [...properties];
  switch (sort) {
    case "priceAsc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "priceDesc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "newest":
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  return sorted;
}

function paginate(
  properties: Property[],
  page: number
): PaginatedResult<Property> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const items = properties.slice(start, end);
  const nextPage = end < properties.length ? safePage + 1 : undefined;
  return { items, nextPage };
}

type SortableQuery<T> = {
  order: (column: string, options: { ascending: boolean }) => T;
};

function applySortToQuery<T extends SortableQuery<T>>(query: T, sort: PropertySort): T {
  if (sort === "priceAsc") {
    return query.order("price", { ascending: true });
  }

  if (sort === "priceDesc") {
    return query.order("price", { ascending: false });
  }

  return query.order("created_at", { ascending: false });
}

export async function getById(id: string): Promise<Property | null> {
  if (!id) {
    return null;
  }

  if (hasSupabaseEnv) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("properties")
        .select(PROPERTY_COLUMNS)
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return mapPropertyFromSupabase(data);
      }
    } catch (error) {
      console.warn("[properties] Failed to load property by id, falling back to mocks", error);
    }
  }

  const fallback = mockProperties.find((property) => property.id === id);
  return fallback ? cloneProperty(fallback) : null;
}

function toStringArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  return [];
}

function cloneProperty(property: Property): Property {
  if (typeof structuredClone === "function") {
    return structuredClone(property);
  }

  return JSON.parse(JSON.stringify(property)) as Property;
}
