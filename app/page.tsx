
"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import PropertyGrid from "@/components/property-grid";
import { useAppState } from "@/components/providers/app-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const { properties, toggleFavorite, favorites } = useAppState();
  const featured = properties.slice(0, 4);

  return (
    <div className="space-y-14">
      <Card className="rounded-3xl border-none bg-surface px-6 py-12 shadow-soft md:px-12 md:py-16">
        <CardContent className="p-0">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-brand.primary/10 px-4 py-1 text-sm font-medium text-brand.primary">
              Rental matchmaking for tenants and landlords
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-textc md:text-5xl">
              Find or list your next home with ease.
            </h1>
            <p className="text-lg text-textc/70">
              Browse verified rentals, manage listings, and chat instantly with interested tenants.
              Rento Bridge keeps every milestone of the rental journey in one place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/browse" className={buttonStyles({ variant: "primary", size: "lg" })}>
                I&#39;m a tenant
              </Link>
              <Link
                href="/dashboard"
                className={`${buttonStyles({ variant: "outline", size: "lg" })}`}
              >
                I&#39;m a landlord
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-textc/60">
              <div className="flex -space-x-2">
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

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-textc">Featured rentals</h2>
            <p className="text-sm text-textc/60">
              Explore trending properties handpicked for location, value, and amenities.
            </p>
          </div>
          <Link
            href="/browse"
            className="text-sm font-medium text-brand.blue hover:text-brand.primary hover:underline"
          >
            View all properties
          </Link>
        </div>
        <PropertyGrid
          properties={featured}
          toggleFavorite={toggleFavorite}
          favorites={favorites}
        />
      </section>

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

const benefits = [
  {
    title: "Smarter discovery",
    copy: "Filter by city, price, and furnishing to instantly narrow the listings that suit you.",
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
];

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
