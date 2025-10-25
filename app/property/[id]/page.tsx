import type { Metadata } from "next";
import MapLoader from "@/components/MapLoader";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PropertyAbout } from "@/components/property/PropertyAbout";
import { PropertyAmenities } from "@/components/property/PropertyAmenities";
import { PropertyContactCard } from "@/components/property/PropertyContactCard";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyHeadline } from "@/components/property/PropertyHeadline";
import { PropertyHighlights } from "@/components/property/PropertyHighlights";
import { PropertyKeyFacts } from "@/components/property/PropertyKeyFacts";
import PropertyCard from "@/components/PropertyCard";
import { buttonStyles } from "@/components/ui/button";
import { env } from "@/lib/env";
import { getById, getMany } from "@/lib/data-access/properties";
import { getCurrentUser } from "@/lib/data-access/profile";
import type { Property } from "@/lib/types";


type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const property = await getById(params.id);

  if (!property) {
    return {
      title: "Property not found - Rento"
    };
  }

  const title = `${property.title} - Rento`;
  const description =
    property.description ??
    `View details for ${property.title} in ${property.city}. Check pricing, availability, and amenities.`;
  const url = `${(env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example").replace(/\/$/, "")}/property/${params.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Rento",
      type: "article",
      images: [
        // Generated OG image (higher priority)
        { url: `${(env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example").replace(/\/$/, "")}/og/${property.id}.png`, alt: property.title },
        // Fall back to property-hosted images when available
        ...(property.images.length
          ? property.images.map((image) => ({ url: image, alt: property.title }))
          : [])
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function PropertyDetail({ params }: Params) {
  const property = await getById(params.id);

  if (!property) {
    notFound();
  }

  const [nearby, currentUser] = await Promise.all([loadNearbyProperties(property), getCurrentUser()]);
  const isAuthenticated = Boolean(currentUser);
  const mapboxToken = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;
  const baseUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example").replace(/\/$/, "");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    url: `${baseUrl}/property/${property.id}`,
    description:
      property.description ??
      `View details for ${property.title} in ${property.city}. Check pricing, availability, and amenities.`,
    address: property.address ?? undefined,
    numberOfRooms: property.beds,
    numberOfBathroomsTotal: property.baths,
    petsAllowed: property.pets,
    floorSize: property.area
      ? {
          "@type": "QuantitativeValue",
          value: property.area,
          unitText: "SQFT"
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/property/${property.id}`
    }
  };

  return (
    <article className="space-y-8 text-textc">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/browse" className="hover:text-brand-teal focus-visible:text-brand-teal">
              Browse
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={{ pathname: "/browse", query: { city: property.city } }}
              className="hover:text-brand-teal focus-visible:text-brand-teal"
            >
              {property.city}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-brand-dark">{property.title}</li>
        </ol>
      </nav>

      <PropertyGallery images={property.images} title={property.title} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10">
        <div className="space-y-6">
          <PropertyHeadline property={property} />
          <PropertyHighlights property={property} />
          <PropertyAbout property={property} />
          <PropertyAmenities amenities={property.amenities} />
          {property.coordinates ? (
            <section aria-labelledby="location-heading" className="space-y-3">
              <div className="space-y-1">
                <h2 id="location-heading" className="text-xl font-semibold text-brand-dark">
                  Location
                </h2>
                <p className="text-sm text-text-muted">Explore the neighbourhood around this home.</p>
              </div>
              <MapLoader
                coordinates={property.coordinates}
                address={property.address}
                mapboxToken={mapboxToken}
              />
            </section>
          ) : null}
        </div>
        <aside className="space-y-6">
          <PropertyContactCard
            propertyId={property.id}
            propertyTitle={property.title}
            isAuthenticated={isAuthenticated}
          />
          <PropertyKeyFacts property={property} />
          <section
            aria-labelledby="nearby-heading"
            className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <h2 id="nearby-heading" className="text-lg font-semibold text-brand-dark">
                Nearby homes
              </h2>
              <Link href="/browse" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {nearby.length === 0 ? (
                <p className="text-sm text-text-muted">No nearby homes available right now.</p>
              ) : (
                nearby.map((item) => (
                  <div key={item.id}>
                    <PropertyCard property={item} />
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
}

async function loadNearbyProperties(property: Property) {
  const { items } = await getMany({ city: property.city }, "newest", 1);
  return items.filter((item) => item.id !== property.id).slice(0, 3);
}

// Map loading is handled inside MapLoader (client) to avoid pulling Mapbox until user action
