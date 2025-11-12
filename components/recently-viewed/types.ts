import type { Property } from "@/lib/types";

export type RecentlyViewedProperty = Pick<Property, "id" | "slug" | "title" | "price" | "city" | "beds" | "baths" | "type"> & {
  image?: string | null;
};

export const RECENTLY_VIEWED_STORAGE_KEY = "rento_recent_properties";
export const RECENTLY_VIEWED_UPDATED_EVENT = "rento:recently-viewed-updated";
export const RECENTLY_VIEWED_MAX = 6;
