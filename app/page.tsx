export const revalidate = 3600;

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { SearchHero } from "@/components/search/search-hero";
import { Card, CardContent } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { getFeatured } from "@/lib/search/service";
import type { ListingSummary } from "@/lib/search/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export default async function Page() {
  const featured = await getFeatured(4);

  return (
    <div className="space-y-14">
      <SearchHero />

      <Card className="rounded-3xl border-none bg-surface px-6 py-10 shadow-soft md:px-12 md:py-16">
        <CardContent className="p-0">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-brand.primary/10 px-4 py-1 text-sm font-medium text-brand.primary">
                Rental matchmaking for tenants and landlords
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-textc md:text-4xl">
                Manage listings and renters in one unified workspace.
              </h2>
              <p className="text-base text-textc/70">
                Whether you&apos;re listing a new property or searching for your next home, Rento
                Bridge streamlines applications, messaging, and insights so you can move forward
                with confidence.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/search" className={buttonStyles({ variant: "primary", size: "lg" })}>
                  Find a rental
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonStyles({ variant: "outline", size: "lg" })}
                >
                  Manage my listings
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-textc/60">
                <div className="flex -space-x-2" aria-hidden>
                  {["T", "L", "P"].map((initial) => (
                    <span
                      key={initial}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-brand.primary/80 text-xs font-bold text-white"
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                Trusted by renters and landlords across the Rento Bridge community.
              </div>
            </div>
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-brand.primary/20 bg-brand.blue/5 p-6 text-textc">
              <div className="space-y-4">
                <StatCard title="Verified listings" value="120+">
                  Discover vetted homes with transparent pricing and amenities.
                </StatCard>
                <StatCard title="Fast responses" value="Under 2 hours">
                  Integrated messaging keeps conversations moving quickly.
                </StatCard>
              </div>
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-brand.primary/20 blur-3xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <FeaturedSection featured={featured} />

      <section className="grid gap-6 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <Card key={benefit.title}>
            <CardContent>
              <div className="mb-3 text-2xl" aria-hidden>
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-textc">{benefit.title}</h3>
              <p className="mt-2 text-sm text-textc/70">{benefit.copy}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

function FeaturedSection({ featured }: { featured: ListingSummary[] }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-textc">Featured rentals</h2>
          <p className="text-sm text-textc/60">
            Explore trending properties handpicked for location, value, and amenities.
          </p>
        </div>
        <Link
          href="/search"
          className="text-sm font-medium text-brand.blue hover:text-brand.primary hover:underline"
        >
          Browse full marketplace
        </Link>
      </div>

      {featured.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.map((listing) => (
            <FeaturedCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-textc/70">
            No featured rentals yet. Check back soon for new highlights.
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function FeaturedCard({ listing }: { listing: ListingSummary }) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border border-brand-dark/10 bg-white/90 shadow-soft">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-bg">
        {listing.thumbnail_url ? (
          <Image
            src={listing.thumbnail_url}
            alt={`${listing.title} photo`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-brand-dark/60">
            Image coming soon
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
          {formatRent(listing.rent)}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-textc">{listing.title}</h3>
          <p className="text-sm text-textc/70">
            {[listing.city, listing.state, listing.postal_code].filter(Boolean).join(", ") ||
              "Location coming soon"}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-3">
          <Link
            href={`/listings/${listing.slug}`}
            className={buttonStyles({ variant: "outline", size: "md" })}
          >
            View details
          </Link>
          <Link
            href="/messages"
            className={buttonStyles({ variant: "ghost", size: "md" })}
          >
            Message
          </Link>
        </div>
      </div>
    </Card>
  );
}

function formatRent(amount: number) {
  return `${currencyFormatter.format(amount)}/mo`;
}

const benefits = [
  {
    title: "Smarter discovery",
    copy: "Filter by location, price, beds, baths, and amenities to surface the perfect matches.",
    icon: "\u{1F50D}"
  },
  {
    title: "Stress-free onboarding",
    copy: "Personalize your tenant or landlord profile so the platform tailors the experience.",
    icon: "\u{1F9ED}"
  },
  {
    title: "End-to-end management",
    copy: "Track inquiries, manage listings, and handle verifications without leaving Rento.",
    icon: "\u{1F4E6}"
  }
] as const;

function StatCard({ title, value, children }: { title: string; value: string; children: ReactNode }) {
  return (
    <Card className="border-none bg-white/70 text-textc shadow-soft">
      <CardContent className="space-y-2">
        <div className="text-sm text-textc/60">{title}</div>
        <div className="text-3xl font-bold text-textc">{value}</div>
        <p className="text-sm text-textc/70">{children}</p>
      </CardContent>
    </Card>
  );
}
