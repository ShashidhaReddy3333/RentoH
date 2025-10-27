# SEO & Metadata Guide - RentoH

This document outlines the SEO implementation and best practices for the RentoH application.

---

## ✅ Implemented SEO Features

### **1. Comprehensive Metadata**

All pages include complete metadata with Open Graph and Twitter Card support.

#### Home Page (`app/page.tsx`)
```typescript
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Rento – Find Your Perfect Rental Home",
      template: "%s | Rento"
    },
    description: "Discover verified rental homes...",
    keywords: ["rental homes", "apartments for rent", ...],
    openGraph: { ... },
    twitter: { ... },
    robots: { index: true, follow: true }
  };
}
```

**Features:**
- ✅ Title template for consistent branding
- ✅ Comprehensive keywords
- ✅ Open Graph images (1200x630)
- ✅ Twitter Card metadata
- ✅ Canonical URLs
- ✅ Robot directives

---

### **2. Dynamic Sitemap (`app/sitemap.ts`)**

Automatically generates sitemap with priorities and change frequencies.

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0
    },
    {
      url: `${baseUrl}/browse`,
      changeFrequency: "hourly",
      priority: 0.9
    },
    // ... property pages with priority 0.8
  ];
}
```

**Priorities:**
| Route | Priority | Change Frequency |
|-------|----------|------------------|
| `/` | 1.0 | daily |
| `/browse` | 0.9 | hourly |
| `/property/:id` | 0.8 | weekly |
| `/about`, `/contact` | 0.5 | monthly |
| `/privacy`, `/terms` | 0.3 | yearly |

---

### **3. Robots.txt (`app/robots.ts`)**

Controls search engine crawling with environment-aware rules.

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: isProduction ? "/" : undefined,
        disallow: isProduction ? DISALLOWED_PATHS : ["/"],
        crawlDelay: 1
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
```

**Disallowed Paths (Private Routes):**
- `/admin/*`
- `/dashboard/*`
- `/messages/*`
- `/favorites/*`
- `/profile/*`
- `/onboarding/*`
- `/applications/*`
- `/tours/*`
- `/api/*`
- `/auth/*`

**Environment Behavior:**
- **Production:** Index public pages, block private routes
- **Development/Staging:** Block all indexing

---

### **4. JSON-LD Structured Data**

#### Organization Schema (`app/layout.tsx`)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Rento",
  "url": "https://rento.example",
  "logo": "https://rento.example/logo.png",
  "description": "Find verified rentals...",
  "sameAs": [
    "https://twitter.com/rento",
    "https://facebook.com/rento"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "support@rento.example"
  }
}
```

#### WebSite Schema with Search
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Rento",
  "url": "https://rento.example",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://rento.example/browse?city={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

#### Property Listing Schema (`lib/seo/json-ld.ts`)
```typescript
generatePropertyJsonLd(property, siteUrl)
```

Generates:
- **RealEstateListing** schema
- **Offer** with price and currency
- **PostalAddress** with location
- **GeoCoordinates** for maps
- **Amenities** as LocationFeatureSpecification

---

## 📊 Metadata Structure

### Page-Level Metadata

Each page should implement `generateMetadata()`:

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example";
  const url = `${siteUrl}/your-page`;
  
  return {
    title: "Page Title",
    description: "Page description (150-160 characters)",
    keywords: ["keyword1", "keyword2"],
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: "Rento",
      title: "Page Title",
      description: "Page description",
      images: [{
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Image description"
      }]
    },
    twitter: {
      card: "summary_large_image",
      title: "Page Title",
      description: "Page description",
      images: [`${siteUrl}/og-image.png`],
      creator: "@rento"
    },
    robots: {
      index: true,
      follow: true
    }
  };
}
```

---

## 🖼️ Open Graph Images

### Required Images

Create these OG images (1200x630px):

| Image | Usage | Location |
|-------|-------|----------|
| `og-image.png` | Home page | `/public/og-image.png` |
| `og-browse.png` | Browse page | `/public/og-browse.png` |
| `og-property.png` | Property template | `/public/og-property.png` |
| `logo.png` | Organization logo | `/public/logo.png` |

### Image Specifications
- **Dimensions:** 1200x630px (1.91:1 ratio)
- **Format:** PNG or JPG
- **Size:** < 1MB
- **Content:** Include branding, title, and key visual

---

## 🔍 Keywords Strategy

### Home Page Keywords
```typescript
keywords: [
  "rental homes",
  "apartments for rent",
  "house rentals",
  "condo rentals",
  "find rentals",
  "rental listings",
  "verified rentals",
  "landlord messaging",
  "rental search"
]
```

### Browse Page Keywords
```typescript
keywords: [
  "browse rentals",
  "rental search",
  "apartments",
  "houses for rent",
  "condos",
  "pet-friendly rentals",
  "furnished apartments",
  "verified listings"
]
```

### Property Page Keywords (Dynamic)
```typescript
keywords: [
  `${property.beds} bedroom ${property.type}`,
  `${property.city} rentals`,
  `${property.type} for rent`,
  property.pets ? "pet-friendly rental" : undefined,
  property.furnished ? "furnished rental" : undefined
].filter(Boolean)
```

---

## 📱 Social Media Meta Tags

### Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@rento" />
<meta name="twitter:creator" content="@rento" />
<meta name="twitter:title" content="Page Title" />
<meta name="twitter:description" content="Description" />
<meta name="twitter:image" content="https://rento.example/og-image.png" />
```

### Facebook Open Graph
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://rento.example/" />
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="Description" />
<meta property="og:image" content="https://rento.example/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Rento" />
<meta property="og:locale" content="en_US" />
```

---

## 🎯 SEO Best Practices

### Title Tags
- **Length:** 50-60 characters
- **Format:** `Primary Keyword – Brand Name`
- **Template:** Use `%s | Rento` for consistency

### Meta Descriptions
- **Length:** 150-160 characters
- **Include:** Primary keyword, call-to-action
- **Unique:** Each page should have unique description

### Canonical URLs
- Always set canonical URL
- Use absolute URLs
- Ensure consistency (trailing slash)

### Headings
- **H1:** One per page, include primary keyword
- **H2-H6:** Logical hierarchy, include secondary keywords
- **Semantic:** Use for structure, not styling

---

## 🔗 Internal Linking

### Breadcrumbs
```typescript
const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Browse", url: "/browse" },
  { name: property.title, url: `/property/${property.id}` }
];

const breadcrumbLd = generateBreadcrumbJsonLd(breadcrumbs);
```

### Navigation
- Clear site structure
- Descriptive anchor text
- Logical hierarchy

---

## 📈 Performance & SEO

### Core Web Vitals
- **LCP:** < 2.5s (Largest Contentful Paint)
- **FID:** < 100ms (First Input Delay)
- **CLS:** < 0.1 (Cumulative Layout Shift)

### Optimization
- ✅ Image optimization (Next.js Image)
- ✅ Code splitting
- ✅ Server-side rendering
- ✅ Static generation where possible
- ✅ Lazy loading

---

## 🧪 Testing & Validation

### Tools
- **Google Search Console:** Monitor indexing
- **Bing Webmaster Tools:** Bing indexing
- **Google Rich Results Test:** Validate JSON-LD
- **Facebook Sharing Debugger:** Test OG tags
- **Twitter Card Validator:** Test Twitter cards
- **Lighthouse:** SEO audit

### Validation Commands
```bash
# Test metadata
curl -I https://rento.example/

# Validate sitemap
curl https://rento.example/sitemap.xml

# Check robots.txt
curl https://rento.example/robots.txt

# Rich results test
https://search.google.com/test/rich-results
```

---

## 📋 SEO Checklist

### Every Page
- [ ] Unique title tag (50-60 chars)
- [ ] Unique meta description (150-160 chars)
- [ ] Canonical URL set
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Appropriate robots directives
- [ ] H1 tag with primary keyword
- [ ] Semantic HTML structure
- [ ] Alt text for all images
- [ ] Internal links with descriptive text

### Site-Wide
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] JSON-LD structured data
- [ ] SSL certificate (HTTPS)
- [ ] Mobile-responsive design
- [ ] Fast page load times
- [ ] Clean URL structure
- [ ] 404 page
- [ ] XML sitemap submitted to search engines

---

## 🚀 Quick Reference

### Adding Metadata to New Pages

```typescript
// app/your-page/page.tsx
import type { Metadata } from "next";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example";
  const url = `${siteUrl}/your-page`;
  
  return {
    title: "Your Page Title",
    description: "Your page description",
    alternates: { canonical: url },
    openGraph: {
      title: "Your Page Title",
      description: "Your page description",
      url,
      siteName: "Rento",
      type: "website",
      images: [{
        url: `${siteUrl}/og-your-page.png`,
        width: 1200,
        height: 630
      }]
    },
    twitter: {
      card: "summary_large_image",
      title: "Your Page Title",
      description: "Your page description"
    }
  };
}
```

### Adding JSON-LD

```typescript
// In your page component
export default function YourPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Page Name",
    description: "Page description"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* page content */}
    </>
  );
}
```

---

Last updated: 2025-10-27
