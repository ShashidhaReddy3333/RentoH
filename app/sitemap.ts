import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { getMany } from "@/lib/data-access/properties";

// Define static routes with their priorities and change frequencies
const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/browse", priority: 0.9, changeFrequency: "hourly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example").replace(/\/$/, "");

  // Static pages
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  // Dynamic property pages
  try {
    const { items } = await getMany({}, "newest", 1);
    const propertyEntries: MetadataRoute.Sitemap = items.map((property) => ({
      url: `${baseUrl}/property/${property.id}`,
      lastModified: property.createdAt ? new Date(property.createdAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }));

    return [...staticEntries, ...propertyEntries];
  } catch (error) {
    console.error("[sitemap] Failed to fetch properties:", error);
    // Return static entries if property fetch fails
    return staticEntries;
  }
}

