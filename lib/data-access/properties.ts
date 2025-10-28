import { hasSupabaseEnv, env } from "@/lib/env";
import { mockProperties } from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import type {
  PaginatedResult,
  Property,
  PropertyFilters,
  PropertySort
} from "@/lib/types";

const PAGE_SIZE = 12;

export type SupabasePropertyRow = {
  id: string;
  slug?: string | null;
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
  postal_code?: string | null;
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
  status?: string | null;
};

export const PROPERTY_COLUMNS = `
  id,
  slug,
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
  postal_code,
  description,
  amenities,
  area,
  available_from,
  neighborhood,
  latitude,
  longitude,
  walk_score,
  transit_score,
  walkthrough_video_url,
  status
`;

export async function getFeatured(): Promise<Property[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    console.warn("[properties] Supabase unavailable, using mock featured listings");
    return mockProperties.slice(0, 6);
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) throw error;
    if (!data) return mockProperties.slice(0, 6);
    
    return data.map(mapPropertyFromSupabaseRow);
  } catch (error) {
    console.error("[properties] Failed to load featured listings, falling back to mock data", error);
    return mockProperties.slice(0, 6);
  }
}

async function fetchManyFromSupabase(
  filters: PropertyFilters,
  sort: PropertySort,
  page: number
): Promise<PaginatedResult<Property>> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable.");
  }
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

  // Extended search filters (using type assertion for now, ideally PropertyFilters would be extended)
  if ((filters as PropertyFilters & { neighborhood?: string }).neighborhood) {
    query = query.ilike("neighborhood", `%${(filters as PropertyFilters & { neighborhood?: string }).neighborhood}%`);
  }

  if ((filters as PropertyFilters & { availableFrom?: string }).availableFrom) {
    // select properties available on or after the requested date
    query = query.gte("available_from", (filters as PropertyFilters & { availableFrom?: string }).availableFrom);
  }

  // amenities: expect array of strings; match any of them
  const amenitiesRaw = (filters as PropertyFilters & { amenities?: string[] }).amenities;
  if (Array.isArray(amenitiesRaw)) {
    const amenities: string[] = amenitiesRaw;
    amenities.forEach((amenity) => {
      query = query.ilike("amenities", `%${amenity}%`);
    });
  }

  // keywords: search title or description
  if ((filters as PropertyFilters & { keywords?: string }).keywords) {
    const kw = (filters as PropertyFilters & { keywords?: string }).keywords;
    // supabase .or uses a comma-separated conditions string
    try {
      query = query.or(`title.ilike.%${kw}%,description.ilike.%${kw}%`);
    } catch (e: unknown) { // Catching as unknown and handling
      // fallback: ignore if .or fails for any reason
      console.warn("Supabase .or query failed, ignoring keywords filter:", e);
    }
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

  const items = data.map(mapPropertyFromSupabaseRow);
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

export function mapPropertyFromSupabaseRow(record: SupabasePropertyRow): Property {
  return {
    id: record.id,
    slug: record.slug ?? undefined,
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
    walkthroughVideoUrl: record.walkthrough_video_url ?? undefined,
    status: mapStatus(record.status)
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

    // neighborhood filter
    if (filters.neighborhood) {
      if (!property.neighborhood) return false;
      if (!property.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) return false;
    }

    // availableFrom filter (property.availableFrom must be on or before requested date)
    if (filters.availableFrom) {
      if (!property.availableFrom) return false;
      const requested = new Date(filters.availableFrom).getTime();
      const avail = new Date(property.availableFrom).getTime();
      if (Number.isNaN(requested) || Number.isNaN(avail)) return false;
      if (avail > requested) return false;
    }

    // amenities: require that every requested amenity is present
    if (filters.amenities && filters.amenities.length > 0) {
      const propsAm = property.amenities ?? [];
      const lower = propsAm.map((a) => a.toLowerCase());
      const missing = filters.amenities.some((req) => !lower.includes(req.toLowerCase()));
      if (missing) return false;
    }

    // keywords: search title, description and amenities
    if (filters.keywords) {
      const kw = filters.keywords.toLowerCase();
      const inTitle = property.title.toLowerCase().includes(kw);
      const inDesc = (property.description ?? "").toLowerCase().includes(kw);
      const inAmenities = (property.amenities ?? []).some((a) => a.toLowerCase().includes(kw));
      if (!inTitle && !inDesc && !inAmenities) return false;
    }

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

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    console.warn("[properties] Supabase unavailable, checking mock data");
    return mockProperties.find(p => p.id === id) ?? null;
  }
  
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("[properties] Failed to load property by id", error);
    return mockProperties.find(p => p.id === id) ?? null;
  }

  const prop = mapPropertyFromSupabaseRow(data);
  const images = toStringArray(data.images);
  if (images.length === 0) return prop;

  const bucket = env.SUPABASE_STORAGE_BUCKET_LISTINGS || "listing-media";

  // If we have a service role key, create short-lived signed URLs for each image path.
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY);
    const signedPromises = images.map(async (img) => {
      if (!img || img.startsWith("http")) return img;
      try {
        const { data: signed, error: signErr } = await service.storage.from(bucket).createSignedUrl(img, 60 * 60);
        if (signErr || !signed) {
          return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(img)}`;
        }
        return signed.signedUrl;
      } catch (e) {
        return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(img)}`;
      }
    });

    const signedUrls = await Promise.all(signedPromises);
    return { ...prop, images: signedUrls };
  }

  // No service key — fall back to public URL pattern
  const publicUrls = images.map((img) => (img.startsWith("http") ? img : `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(img)}`));
  return { ...prop, images: publicUrls };
}

export async function listOwnedProperties(limit = 4): Promise<Property[]> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[properties] Failed to load landlord properties", error);
    return [];
  }

  return data.map(mapPropertyFromSupabaseRow);
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

function mapStatus(value: string | null | undefined): Property["status"] | undefined {
  if (value === "draft" || value === "active" || value === "archived") {
    return value;
  }
  return undefined;
}


