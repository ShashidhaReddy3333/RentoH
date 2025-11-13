import { hasSupabaseEnv, env } from "@/lib/env";
import { mockProperties } from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import { createSlug } from "@/lib/utils/slug";
import type {
  PaginatedResult,
  Property,
  PropertyFilters,
  PropertySort
} from "@/lib/types";

const PAGE_SIZE = 12;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SupabasePropertyRow = {
  id: string;
  slug?: string | null;
  title: string;
  price: number;
  beds: number;
  baths: number;
  type: Property["type"];
  city: string;
  landlord_id?: string | null;
  verified?: boolean | null;
  pets?: boolean | null;
  furnished?: boolean | null;
  smoking?: boolean | null;
  images?: string[] | string | null;
  created_at?: string | null;
  address?: string | null;
  postal_code?: string | null;
  description?: string | null;
  amenities?: string[] | string | null;
  area?: number | null;
  available_from?: string | null;
  rent_frequency?: string | null;
  parking?: string | null;
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
  landlord_id,
  verified,
  pets,
  furnished,
  smoking,
  images,
  created_at,
  address,
  postal_code,
  description,
  amenities,
  area,
  available_from,
  rent_frequency,
  parking,
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

    const mapped = await Promise.all(data.map(mapRowToPropertyWithAssets));
    return mapped;
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
    .select(PROPERTY_COLUMNS, { count: "exact" })
    .eq("status", "active");

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

  // Extended search filters
  if (filters.neighborhood) {
    query = query.ilike("neighborhood", `%${filters.neighborhood}%`);
  }

  if (filters.availableFrom) {
    // select properties available on or after the requested date
    query = query.gte("available_from", filters.availableFrom);
  }

  // amenities: expect array of strings; match any of them
  if (filters.amenities && Array.isArray(filters.amenities)) {
    filters.amenities.forEach((amenity) => {
      query = query.ilike("amenities", `%${amenity}%`);
    });
  }

  // keywords: search title or description
  if (filters.keywords) {
    // supabase .or uses a comma-separated conditions string
    try {
      query = query.or(`title.ilike.%${filters.keywords}%,description.ilike.%${filters.keywords}%`);
    } catch (e: unknown) {
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

  const items = await Promise.all(data.map(mapRowToPropertyWithAssets));
  const totalCount = typeof count === "number" ? count : undefined;
  const hasNext = totalCount != null ? to + 1 < totalCount : items.length === PAGE_SIZE;
  return { items, nextPage: hasNext ? page + 1 : undefined };
}

export async function getMany(
  filters: PropertyFilters = {},
  sort: PropertySort = "newest",
  page = 1
): Promise<PaginatedResult<Property>> {
  const normalizedFilters = normalizeFilters(filters);

  if (!hasSupabaseEnv) {
    const filtered = applyFilters(mockProperties, normalizedFilters);
    const sorted = applySort(filtered, sort);
    return paginate(sorted, page);
  }

  try {
    const result = await fetchManyFromSupabase(normalizedFilters, sort, page);
    if (result.items.length === 0 && env.NODE_ENV !== "production") {
      console.warn("[properties] Supabase returned no listings; falling back to mock data for previews.");
      const filtered = applyFilters(mockProperties, normalizedFilters);
      const sorted = applySort(filtered, sort);
      return paginate(sorted, page);
    }
    return result;
  } catch (error) {
    console.error("[properties] Supabase query failed", error);
    throw error;
  }
}

export function mapPropertyFromSupabaseRow(record: SupabasePropertyRow): Property {
  const imageStoragePaths = toStringArray(record.images);
  return {
    id: record.id,
    slug: record.slug ?? undefined,
    title: record.title,
    images: resolveImageUrls(imageStoragePaths),
    imageStoragePaths,
    price: record.price,
    beds: record.beds,
    baths: record.baths,
    type: record.type,
    city: record.city,
    postalCode: record.postal_code ?? undefined,
    verified: Boolean(record.verified),
    pets: Boolean(record.pets),
    furnished: Boolean(record.furnished),
    smoking: record.smoking ?? undefined,
    createdAt: record.created_at ?? new Date().toISOString(),
    address: record.address ?? undefined,
    description: record.description ?? undefined,
    amenities: toStringArray(record.amenities),
    area: record.area ?? undefined,
    availableFrom: record.available_from ?? undefined,
    rentFrequency: resolveRentFrequency(record.rent_frequency),
    parking: record.parking ?? undefined,
    neighborhood: record.neighborhood ?? undefined,
    landlordId: record.landlord_id ?? undefined,
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
    return findMockProperty(id);
  }
  
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("[properties] Failed to load property by id", error);
    return findMockProperty(id);
  }

  return mapRowToPropertyWithAssets(data);
}

async function mapRowToPropertyWithAssets(record: SupabasePropertyRow): Promise<Property> {
  const prop = mapPropertyFromSupabaseRow(record);
  const images = toStringArray(record.images);
  if (images.length === 0) {
    return prop;
  }

  const bucket = env.SUPABASE_STORAGE_BUCKET_LISTINGS || "listings";

  // Use public URLs for production to avoid signed URL complexity
  if (env.SUPABASE_SERVICE_ROLE_KEY && env.NODE_ENV !== 'production') {
    try {
      const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY);
      const signedPromises = images.map(async (img) => {
        if (!img || img.startsWith("http")) return img;
        try {
          const { data: signed, error: signErr } = await service.storage.from(bucket).createSignedUrl(img, 60 * 60);
          if (signErr || !signed) {
            console.warn("[properties] Failed to create signed URL, using public URL fallback", { img, error: signErr });
            return buildPublicStorageUrl(img) ?? img;
          }
          return signed.signedUrl;
        } catch (error) {
          console.warn("[properties] Unexpected error creating signed URL, using public URL fallback", { img, error });
          return buildPublicStorageUrl(img) ?? img;
        }
      });

      const signedUrls = await Promise.all(signedPromises);
      return { ...prop, images: signedUrls, imageStoragePaths: images };
    } catch (error) {
      console.error("[properties] Failed to process signed URLs, falling back to public URLs", error);
      const publicUrls = resolveImageUrls(images);
      return { ...prop, images: publicUrls, imageStoragePaths: images };
    }
  }

  const publicUrls = resolveImageUrls(images);
  return { ...prop, images: publicUrls, imageStoragePaths: images };
}

export async function getBySlugOrId(identifier: string): Promise<Property | null> {
  if (!identifier) {
    return null;
  }

  if (!hasSupabaseEnv) {
    return findMockProperty(identifier);
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return findMockProperty(identifier);
  }

  if (UUID_PATTERN.test(identifier)) {
    return getById(identifier);
  }

  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("slug", identifier)
    .maybeSingle();

  if (error || !data) {
    console.warn("[properties] Failed to load property by slug", identifier, error);
    return getById(identifier);
  }

  return mapRowToPropertyWithAssets(data);
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

  const mapped = await Promise.all(data.map(mapRowToPropertyWithAssets));
  return mapped;
}

function findMockProperty(identifier: string): Property | null {
  if (!identifier) {
    return null;
  }

  const normalized = identifier.trim();
  const normalizedSlug = createSlug(normalized);

  return (
    mockProperties.find((property) => {
      if (property.id === normalized) {
        return true;
      }
      const propertySlug = property.slug ?? createSlug(property.title);
      return propertySlug === normalized || propertySlug === normalizedSlug;
    }) ?? null
  );
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

function encodeStorageKey(path: string): string {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function buildPublicStorageUrl(path: string): string | null {
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return null;
  }

  const bucket = env.SUPABASE_STORAGE_BUCKET_LISTINGS || "listings";
  const normalized = path.replace(/^\/+/, "");
  const encodedPath = encodeStorageKey(normalized);
  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

export function resolveImageUrls(paths: string[]): string[] {
  return paths
    .map((rawPath) => (typeof rawPath === "string" ? rawPath.trim() : ""))
    .filter((path): path is string => path.length > 0)
    .map((path) => {
      if (path.toLowerCase().startsWith("http://") || path.toLowerCase().startsWith("https://")) {
        return path;
      }
      return buildPublicStorageUrl(path) ?? path;
    });
}

function mapStatus(value: string | null | undefined): Property["status"] | undefined {
  if (value === "draft" || value === "active" || value === "archived") {
    return value;
  }
  return undefined;
}

function resolveRentFrequency(value: string | null | undefined): Property["rentFrequency"] | undefined {
  if (value === "monthly" || value === "weekly" || value === "biweekly") {
    return value;
  }
  return undefined;
}

function normalizeFilters(filters: PropertyFilters): PropertyFilters {
  const result: PropertyFilters = {};

  if (filters.city?.trim()) {
    result.city = filters.city.trim();
  }

  if (typeof filters.min === "number" && Number.isFinite(filters.min)) {
    result.min = filters.min;
  }

  if (typeof filters.max === "number" && Number.isFinite(filters.max)) {
    result.max = filters.max;
  }

  if (typeof filters.beds === "number" && filters.beds > 0) {
    result.beds = filters.beds;
  }

  if (typeof filters.baths === "number" && filters.baths > 0) {
    result.baths = filters.baths;
  }

  if (filters.type) {
    result.type = filters.type;
  }

  if (filters.pets === true) {
    result.pets = true;
  }

  if (filters.furnished === true) {
    result.furnished = true;
  }

  if (filters.verified === true) {
    result.verified = true;
  }

  if (filters.neighborhood?.trim()) {
    result.neighborhood = filters.neighborhood.trim();
  }

  if (filters.availableFrom) {
    result.availableFrom = filters.availableFrom;
  }

  if (Array.isArray(filters.amenities) && filters.amenities.length > 0) {
    result.amenities = filters.amenities.filter(Boolean);
  }

  if (filters.keywords?.trim()) {
    result.keywords = filters.keywords.trim();
  }

  return result;
}
