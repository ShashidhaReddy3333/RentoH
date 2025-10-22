"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";

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
    <div
      className={clsx(
        "rounded-3xl border border-white/20 bg-gradient-to-br from-brand.blue/10 via-white to-brand.primary/5 p-8 shadow-xl backdrop-blur",
        "dark:border-white/10 dark:from-brand.blue/20 dark:via-slate-900 dark:to-slate-900/60",
        className
      )}
    >
      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <span className="text-sm font-medium uppercase tracking-wide text-brand.primary">
            Your next home is a search away
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">
            Explore rentals tailored to your lifestyle.
          </h1>
          <p className="max-w-2xl text-base text-slate-700 dark:text-slate-300">
            Search by city, postal code, or neighborhood to discover verified listings with the
            right mix of price, amenities, and convenience.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 md:flex-row md:items-center"
        >
          <div className="flex w-full flex-1 flex-col gap-1">
            <label htmlFor="hero-location" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Location
            </label>
            <input
              id="hero-location"
              type="search"
              placeholder="Search by city, postal code, or neighborhood"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-brand.primary focus:border-brand.primary focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand.primary px-5 py-3 text-base font-semibold text-white shadow-md transition hover:bg-brand.primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand.blue disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isDisabled}
            aria-disabled={isDisabled}
          >
            Search rentals
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">Trending areas:</span>
          {quickLocations.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => pushToSearch({ location: label })}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-brand.primary hover:text-brand.primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
