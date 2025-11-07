import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBySlugOrId } from "@/lib/data-access/properties";
import { getCurrentUser } from "@/lib/data-access/profile";
import { env } from "@/lib/env";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyHeadline } from "@/components/property/PropertyHeadline";
import { PropertyHighlights } from "@/components/property/PropertyHighlights";
import { PropertyAbout } from "@/components/property/PropertyAbout";
import { PropertyAmenities } from "@/components/property/PropertyAmenities";
import { PropertyKeyFacts } from "@/components/property/PropertyKeyFacts";
import { PropertyContactCard } from "@/components/property/PropertyContactCard";
import { PropertyLocationMap } from "@/components/property/PropertyLocationMap";

export const revalidate = 600;

type PageParams = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const property = await getBySlugOrId(params.slug);

  if (!property) {
    return {
      title: "Listing not found | Rento",
      description: "This listing could not be found. Browse Rento to discover available homes."
    };
  }

  const siteUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://rento-h.vercel.app").replace(/\/$/, "");
  const slug = property.slug ?? property.id;
  const canonical = `${siteUrl}/property/${slug}`;
  const description =
    property.description?.slice(0, 155) ??
    `See details for ${property.title} including price, amenities, and availability on Rento.`;
  const heroImage = property.images[0];

  return {
    title: `${property.title} | Rento`,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      type: "article",
      title: `${property.title} | Rento`,
      description,
      url: canonical,
      images: heroImage
        ? [
            {
              url: heroImage,
              width: 1200,
              height: 630,
              alt: property.title
            }
          ]
        : undefined
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title: `${property.title} | Rento`,
      description,
      images: heroImage ? [heroImage] : undefined
    }
  };
}

export default async function PropertyPage({ params }: PageParams) {
  const property = await getBySlugOrId(params.slug);
  if (!property) {
    notFound();
  }

  const user = await getCurrentUser().catch(() => null);
  const isAuthenticated = Boolean(user);
  const mapboxToken = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;
  const amenities = property.amenities ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:space-y-10 lg:py-12">
      <PropertyGallery images={property.images} title={property.title} />
      <PropertyHeadline property={property} />
      <PropertyHighlights property={property} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <PropertyAbout property={property} />
          <PropertyAmenities amenities={amenities} />
          {property.coordinates ? (
            <PropertyLocationMap
              coordinates={property.coordinates}
              address={property.address}
              mapboxToken={mapboxToken}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <PropertyKeyFacts property={property} />
          <PropertyContactCard
            propertyId={property.id}
            propertySlug={property.slug ?? property.id}
            propertyTitle={property.title}
            isAuthenticated={isAuthenticated}
            landlordId={property.landlordId}
          />
        </div>
      </div>
    </main>
  );
}
