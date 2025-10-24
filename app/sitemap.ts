import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { getMany } from "@/lib/data-access/properties";

const STATIC_ROUTES = ["/", "/browse", "/about", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example").replace(/\/$/, "");

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((pathname) => ({
    url: `${baseUrl}${pathname}`,
    lastModified: new Date()
  }));

  const { items } = await getMany({}, "newest", 1);
  const propertyEntries: MetadataRoute.Sitemap = items.map((property) => ({
    url: `${baseUrl}/property/${property.id}`,
    lastModified: property.createdAt ? new Date(property.createdAt) : new Date()
  }));

  return [...staticEntries, ...propertyEntries];
}

