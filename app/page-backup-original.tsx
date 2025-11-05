import dynamic from "next/dynamic";
import Link from "next/link";
import type { Metadata } from "next";
import { LANDING_DATA } from "@/app/landing-data";
import {
  ClipboardDocumentCheckIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

import PropertyCard from "@/components/PropertyCard";
import { buttonStyles } from "@/components/ui/button";
import { env } from "@/lib/env";
import { getFeatured } from "@/lib/data-access/properties";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example";
  const title = "Rento – Find Your Perfect Rental Home";
  const description =
    "Discover verified rental homes, apartments, and condos. Browse thousands of listings, message landlords directly, and move in with confidence. Your rental journey starts here.";
  const imageUrl = `${siteUrl}/og-image.png`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: "%s | Rento"
    },
    description,
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
    ],
    authors: [{ name: "Rento" }],
    creator: "Rento",
    publisher: "Rento",
    formatDetection: {
      email: false,
      address: false,
      telephone: false
    },
    alternates: {
      canonical: siteUrl
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: "Rento",
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Rento - Find Your Perfect Rental Home"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@rento"
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    },
    verification: {
      google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
      // bing: "your-bing-verification-code"
    }
  };
}

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl bg-gradient-to-br from-brand-blue/10 via-brand-teal/10 to-brand-green/10 px-6 py-12 shadow-soft sm:px-10">
        <div className="space-y-6 text-center sm:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand-teal shadow-soft">
            New
            <span className="text-brand-dark">Supabase-ready rental toolkit</span>
          </span>
          <h1 className="text-4xl font-extrabold text-brand-dark sm:text-5xl">Find your next place with Rento</h1>
          <p className="text-lg text-text-muted sm:max-w-xl">
            Discover verified rentals, explore neighbourhoods, and manage conversations in one
            streamlined dashboard.
          </p>
        </div>
        <div>
          <SearchBar />
        </div>
        <dl className="grid gap-4 text-sm text-text-muted sm:grid-cols-3">
          {LANDING_DATA.stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-center shadow-sm"
            >
              <dt className="text-xs uppercase tracking-wide">{item.label}</dt>
              <dd className="text-lg font-semibold text-brand-dark">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <FeaturedSection properties={featured} />
      <HowItWorks />
      <SafetyStrip />
      <section className="grid gap-6 rounded-3xl bg-gradient-to-r from-brand-blue/15 via-brand-teal/15 to-brand-green/15 px-6 py-10 shadow-soft sm:px-10 sm:py-12">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-brand-dark">Ready to start your search?</h2>
          <p className="text-sm text-text-muted">Browse homes, book tours, and message landlords without leaving the app.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/browse" className={buttonStyles({ variant: "primary", size: "lg" })} data-testid="cta-browse">
            Browse homes
            <span className="ml-2" aria-hidden="true">→</span>
          </Link>
          <Link href="/auth/sign-up" className={buttonStyles({ variant: "secondary", size: "lg" })} data-testid="cta-signup">
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}

// Client-only SearchBar — loaded only on interaction/hydration
const SearchBar = dynamic(() => import("@/components/SearchBar"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div className="h-12 animate-pulse rounded-2xl bg-surface-muted" />
    </div>
  )
});


function FeaturedSection({ properties }: { properties: Awaited<ReturnType<typeof getFeatured>> }) {
  return (
    <section aria-labelledby="featured-heading" className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="featured-heading" className="text-2xl font-semibold text-brand-dark">
            Featured homes
          </h2>
          <p className="text-sm text-text-muted">
            Curated rentals updated daily. Switch to Supabase to load your live inventory.
          </p>
        </div>
        <Link
          href="/browse"
          className={buttonStyles({ variant: "secondary", size: "sm" })}
          data-testid="featured-browse"
        >
          Browse all
        </Link>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <div key={property.id}>
            <PropertyCard property={property} />
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Browse verified homes",
      description: "Use filters to match by price, neighbourhood, amenities, and pet policies.",
      icon: MagnifyingGlassIcon
    },
    {
      title: "Book tours & apply",
      description: "Message landlords instantly, schedule tours, and submit applications in-app.",
      icon: ClipboardDocumentCheckIcon
    },
    {
      title: "Move in with support",
      description: "Track applications, receive updates, and stay secure with verified partners.",
      icon: KeyIcon
    }
  ];

  return (
    <section aria-labelledby="how-heading" className="space-y-6">
      <div className="space-y-2">
        <h2 id="how-heading" className="text-2xl font-semibold text-brand-dark">
          How Rento works
        </h2>
        <p className="text-sm text-text-muted">
          A renting journey designed for transparency, speed, and peace of mind.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 text-left shadow-soft"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
              <step.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-brand-dark">{step.title}</h3>
              <p className="text-sm text-text-muted">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SafetyStrip() {
  return (
    <section className="rounded-3xl border border-brand-green/30 bg-brand-green/10 px-6 py-5 text-sm font-semibold text-brand-green shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-3">
          <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
          <span>Verified listings &amp; secure messaging</span>
        </div>
        <Link
          href={{ pathname: "/privacy" }}
          className="text-xs font-semibold text-brand-green underline-offset-4 hover:underline"
        >
          Learn how we keep renters safe
        </Link>
      </div>
    </section>
  );
}
