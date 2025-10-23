"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";

import { Chip } from "@/components/ui/chip";
import { buttonStyles } from "@/components/ui/button";
import { buildSearchHref } from "@/lib/search/params";
import type { SearchFilters } from "@/lib/search/types";

type SearchHeroProps = {
  className?: string;
  defaultLocation?: string;
};

const quickLocations = ["Waterloo", "Kitchener", "Downtown", "University District", "Cambridge"];

export function SearchHero({ className, defaultLocation }: SearchHeroProps) {
  const router = useRouter();
  const [location, setLocation] = useState<string>(defaultLocation ?? "");
  const isDisabled = useMemo(() => location.trim().length === 0, [location]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushToSearch({ location });
  };

  const pushToSearch = (filters: Partial<SearchFilters>) => {
    const cleaned = filters.location?.trim();
    const href = buildSearchHref("/search", {
      ...(cleaned ? { location: cleaned } : {})
    });
    router.push(href as Route);
  };

  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-brand-dark/10 bg-surface py-12 shadow-sm transition-[shadow,transform] hover:shadow-md dark:border-white/10",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-brand-teal/10 blur-3xl md:block" />
      <div className="relative mx-auto flex max-w-container flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-teal">
            Your next home is a search away
          </span>
          <h1 className="text-4xl font-extrabold text-textc sm:text-5xl lg:text-6xl">
            Find rentals that move with your lifestyle.
          </h1>
          <p className="max-w-2xl text-lg text-text-muted">
            Search by city, postal code, or neighborhood to explore verified homes with the right
            mix of price, amenities, and convenience.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-brand-dark/10 bg-surface-muted p-4 shadow-sm dark:border-white/15 sm:flex-row sm:items-end"
        >
          <div className="flex w-full flex-1 flex-col gap-2">
            <label
              htmlFor="hero-location"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted"
            >
              Location
            </label>
            <input
              id="hero-location"
              type="search"
              placeholder="Search by city, postal code, or neighborhood"
              className="input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className={clsx(
              buttonStyles({ variant: "primary", size: "lg" }),
              "w-full sm:w-auto"
            )}
            disabled={isDisabled}
            aria-label="Search rentals"
            aria-disabled={isDisabled}
          >
            Search rentals
          </button>
        </form>

        <div className="space-y-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Trending areas
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {quickLocations.map((label) => (
              <Chip
                key={label}
                onClick={() => pushToSearch({ location: label })}
                className="flex-shrink-0"
                aria-label={`Search rentals in ${label}`}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
