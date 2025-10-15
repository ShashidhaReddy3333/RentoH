
"use client";

import Link from "next/link";
import PropertyGrid from "@/components/property-grid";
import { useAppState } from "@/components/providers/app-provider";

export default function LandingPage() {
  const { properties, toggleFavorite, favorites } = useAppState();
  const featured = properties.slice(0, 4);

  return (
    <div className="space-y-14">
      <section className="rounded-3xl bg-white px-6 py-12 shadow-card md:px-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-[var(--c-primary)]/10 px-4 py-1 text-sm font-medium text-[var(--c-primary)]">
              Rental matchmaking for tenants and landlords
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--c-dark)] md:text-5xl">
              Find or list your next home with ease.
            </h1>
            <p className="text-lg text-gray-600">
              Browse verified rentals, manage listings, and chat instantly with interested tenants.
              Rento Bridge keeps every milestone of the rental journey in one place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/browse" className="btn btn-primary text-base">
                I'm a tenant
              </Link>
              <Link href="/dashboard" className="btn btn-secondary text-base">
                I'm a landlord
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {["T", "L", "P"].map((initial) => (
                  <span
                    key={initial}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[var(--c-primary)]/80 text-xs font-bold text-white"
                  >
                    {initial}
                  </span>
                ))}
              </div>
              Trusted by renters and landlords across the Rento Bridge community.
            </div>
          </div>
          <div className="relative mt-4 overflow-hidden rounded-2xl bg-[var(--c-blue)]/10 p-6">
            <div className="space-y-4">
              <div className="card">
                <div className="text-sm text-gray-500">Verified listings</div>
                <div className="text-3xl font-bold text-[var(--c-dark)]">120+</div>
                <p className="mt-2 text-sm text-gray-600">
                  Discover vetted homes with transparent pricing and amenities.
                </p>
              </div>
              <div className="card">
                <div className="text-sm text-gray-500">Fast responses</div>
                <div className="text-3xl font-bold text-[var(--c-dark)]">Under 2 hours</div>
                <p className="mt-2 text-sm text-gray-600">
                  Integrated messaging keeps conversations moving quickly.
                </p>
              </div>
            </div>
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[var(--c-primary)]/20 blur-3xl" />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--c-dark)]">Featured rentals</h2>
            <p className="text-sm text-gray-500">
              Explore trending properties handpicked for location, value, and amenities.
            </p>
          </div>
          <Link href="/browse" className="text-sm font-medium text-[var(--c-blue)] hover:underline">
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
          <div key={benefit.title} className="card bg-white">
            <div className="mb-3 text-2xl" aria-hidden>
              {benefit.icon}
            </div>
            <h3 className="text-lg font-semibold text-[var(--c-dark)]">{benefit.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{benefit.copy}</p>
          </div>
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
