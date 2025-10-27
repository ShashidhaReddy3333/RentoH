import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

// Private routes that should not be indexed
const DISALLOWED_PATHS = [
  "/admin/*",
  "/dashboard/*",
  "/messages/*",
  "/favorites/*",
  "/profile/*",
  "/onboarding/*",
  "/applications/*",
  "/tours/*",
  "/api/*",
  "/auth/*"
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example").replace(/\/$/, "");
  const isProduction = env.NODE_ENV === "production";

  return {
    rules: [
      {
        userAgent: "*",
        allow: isProduction ? "/" : undefined,
        disallow: isProduction ? DISALLOWED_PATHS : ["/"],
        crawlDelay: 1
      },
      // Specific rules for major search engines
      {
        userAgent: "Googlebot",
        allow: isProduction ? "/" : undefined,
        disallow: isProduction ? DISALLOWED_PATHS : ["/"]
      },
      {
        userAgent: "Bingbot",
        allow: isProduction ? "/" : undefined,
        disallow: isProduction ? DISALLOWED_PATHS : ["/"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}

