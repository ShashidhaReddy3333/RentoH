import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const routes = ["", "/browse", "/auth/sign-in", "/auth/sign-up"];

  return routes.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: new Date()
  }));
}
