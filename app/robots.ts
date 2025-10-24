import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

const DISALLOWED = ["/admin", "/dashboard", "/messages", "/favorites", "/profile"];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}

