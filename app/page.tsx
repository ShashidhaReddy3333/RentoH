export const revalidate = 3600;

import Link from "next/link";
import type { ReactNode } from "react";

import { FeaturedCard } from "@/components/featured-card";
import { SearchHero } from "@/components/search/search-hero";
import { Card, CardContent } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import { getFeatured } from "@/lib/search/service";
import type { ListingSummary } from "@/lib/search/types";

export default async function Page() {
  const featured = await getFeatured(4);

  return (
    <div className="space-y-section">
      <section className="px-4 sm:px-6 lg:px-8">
        <SearchHero />
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-container">
          <Card className="rounded-3xl border-brand-dark/10 bg-white px-6 py-10 shadow-sm transition-shadow hover:shadow-md md:px-12 md:py-16 dark:border-white/10 dark:bg-slate-900/70">
            <CardContent className="p-0">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div className="space-y-6">
                  <span className="inline-flex items-center rounded-full bg-brand-teal/10 px-4 py-1 text-sm font-semibold text-brand-teal">
                    Rental matchmaking made simple
                  </span>
                  <h2 className="text-4xl font-bold text-brand-dark sm:text-5xl dark:text-white">
                    Manage listings and renters with clarity.
                  </h2>
                  <p className="text-base text-brand-dark/70 dark:text-slate-300">
                    Whether you&apos;re listing a new property or searching for your next home,
                    Rento Bridge keeps applications, messaging, and insights together so you can
                    move forward with confidence.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/search"
                      className={`${buttonStyles({ variant: "primary", size: "lg" })} w-full sm:w-auto`}
                    >
                      Find a rental
                    </Link>
                    <Link
                      href="/dashboard"
                      className={`${buttonStyles({ variant: "outline", size: "lg" })} w-full sm:w-auto`}
                    >
                      Manage my listings
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-brand-dark/60 dark:text-slate-300">
                    <div className="flex -space-x-2" aria-hidden>
                      {["T", "L", "P"].map((initial) => (
                        <span
                          key={initial}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white bg-brand-teal text-sm font-bold text-white dark:border-slate-900"
                        >
                          {initial}
                        </span>
                      ))}
                    </div>
                    <span>Trusted by renters and landlords across the Rento Bridge community.</span>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-brand-dark/10 bg-brand-bg p-6 dark:border-white/10 dark:bg-slate-900/60">
                  <StatCard title="Verified listings" value="120+">
                    Explore homes that are reviewed by our team and ready for move-in.
                  </StatCard>
                  <StatCard title="Fast responses" value="Under 2 hours">
                    Integrated messaging keeps conversations moving quickly.
                  </StatCard>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <FeaturedSection featured={featured} />

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-container space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-3xl font-semibold text-brand-dark dark:text-white">
              Why renters choose Rento Bridge
            </h2>
            <p className="text-sm text-brand-dark/70 dark:text-slate-300">
              Explore verified rentals and stay in control from your first search to the signed
              lease.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="space-y-3">
                  <Icon
                    name={benefit.icon}
                    className="h-8 w-8 text-brand-teal"
                    ariaLabel={`${benefit.title} icon`}
                  />
                  <h3 className="text-lg font-semibold text-brand-dark dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-brand-dark/70 dark:text-slate-300">{benefit.copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedSection({ featured }: { featured: ListingSummary[] }) {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-container space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-brand-dark dark:text-white">
              Featured rentals
            </h2>
            <p className="text-sm text-brand-dark/70 dark:text-slate-300">
              Explore verified rentals curated for convenience, community, and comfort.
            </p>
          </div>
          <Link
            href="/search"
            className={`${buttonStyles({ variant: "outline" })} w-full justify-center md:w-auto`}
          >
            Browse marketplace
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
            <CardContent className="p-6 text-sm text-brand-dark/70 dark:text-slate-300">
              No featured rentals yet. Check back soon for new highlights.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

type Benefit = {
  title: string;
  copy: string;
  icon: IconName;
};

const benefits: readonly Benefit[] = [
  {
    title: "Smarter discovery",
    copy: "Filter by location, price, beds, baths, and amenities to surface the perfect matches.",
    icon: "discover"
  },
  {
    title: "Stress-free onboarding",
    copy: "Personalize your profile so landlords and renters understand your priorities instantly.",
    icon: "sparkles"
  },
  {
    title: "End-to-end management",
    copy: "Track inquiries, update listings, and complete verifications without leaving Rento Bridge.",
    icon: "manage"
  }
] as const;

function StatCard({ title, value, children }: { title: string; value: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900/80">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-dark/60 dark:text-slate-400">
        {title}
      </div>
      <div className="text-3xl font-bold text-brand-dark dark:text-white">{value}</div>
      <p className="text-sm text-brand-dark/70 dark:text-slate-300">{children}</p>
    </div>
  );
}
