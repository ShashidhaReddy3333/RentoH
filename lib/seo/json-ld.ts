import type { Property } from "@/lib/types";

/**
 * Generate JSON-LD structured data for a rental property listing
 * Follows schema.org/RealEstateListing and schema.org/Apartment specifications
 */
export function generatePropertyJsonLd(property: Property, siteUrl: string) {
  const propertyUrl = `${siteUrl}/property/${property.id}`;
  const imageUrl = Array.isArray(property.images) && property.images.length > 0
    ? property.images[0]
    : `${siteUrl}/placeholder-property.jpg`;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || `${property.beds} bed, ${property.baths} bath ${property.type} for rent`,
    url: propertyUrl,
    image: Array.isArray(property.images) ? property.images : [imageUrl],
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: property.price,
        priceCurrency: "USD",
        unitText: "MONTH"
      }
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressRegion: "Unknown", // State not available in Property type
      postalCode: "", // Postal code not available in Property type
      addressCountry: "US"
    },
    geo: property.coordinates ? {
      "@type": "GeoCoordinates",
      latitude: property.coordinates.lat,
      longitude: property.coordinates.lng
    } : undefined,
    numberOfRooms: property.beds,
    numberOfBathroomsTotal: property.baths,
    floorSize: property.area ? {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "SQF"
    } : undefined,
    amenityFeature: property.amenities?.map((amenity: string) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity
    })),
    petsAllowed: property.pets ? "Yes" : "No",
    datePosted: property.createdAt,
    additionalType: property.type === "apartment" ? "https://schema.org/Apartment" :
                    property.type === "house" ? "https://schema.org/House" :
                    property.type === "condo" ? "https://schema.org/Residence" :
                    "https://schema.org/Accommodation"
  };
}

/**
 * Generate BreadcrumbList JSON-LD for property pages
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generate ItemList JSON-LD for property listing pages (browse, search results)
 */
export function generatePropertyListJsonLd(properties: Property[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: properties.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/property/${property.id}`,
      name: property.title,
      image: Array.isArray(property.images) && property.images.length > 0
        ? property.images[0]
        : `${siteUrl}/placeholder-property.jpg`
    }))
  };
}

/**
 * Generate FAQPage JSON-LD for FAQ sections
 */
export function generateFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate LocalBusiness JSON-LD if Rento has physical locations
 */
export function generateLocalBusinessJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Rento",
    image: `${siteUrl}/logo.png`,
    url: siteUrl,
    telephone: "+1-555-RENTO-00",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Rental Street",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94102",
      addressCountry: "US"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.7749,
      longitude: -122.4194
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00"
      }
    ]
  };
}
