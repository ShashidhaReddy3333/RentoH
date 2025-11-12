"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { ClockIcon } from "@heroicons/react/24/outline";

import {
  RECENTLY_VIEWED_STORAGE_KEY,
  RECENTLY_VIEWED_UPDATED_EVENT,
  type RecentlyViewedProperty
} from "@/components/recently-viewed/types";
import { formatCurrency } from "@/lib/utils/format";

type RecentlyViewedRailProps = {
  className?: string;
};

export function RecentlyViewedRail({ className }: RecentlyViewedRailProps) {
  const [items, setItems] = useState<RecentlyViewedProperty[]>([]);

  const loadFromStorage = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as RecentlyViewedProperty[]) : [];
      setItems(parsed);
    } catch (error) {
      console.warn("[recently-viewed] Failed to parse storage", error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const handler = () => loadFromStorage();
    window.addEventListener("storage", handler);
    window.addEventListener(RECENTLY_VIEWED_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(RECENTLY_VIEWED_UPDATED_EVENT, handler);
    };
  }, [loadFromStorage]);

  if (items.length === 0) {
    return null;
  }

  const clear = () => {
    window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    setItems([]);
    window.dispatchEvent(new Event(RECENTLY_VIEWED_UPDATED_EVENT));
  };

  return (
    <section
      className={clsx(
        "space-y-4 rounded-3xl border border-brand-outline/60 bg-white p-4 shadow-soft sm:p-6",
        className
      )}
      aria-labelledby="recently-viewed-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="recently-viewed-heading" className="text-lg font-semibold text-brand-dark">
            Recently viewed homes
          </h2>
          <p className="text-xs text-text-muted">We keep the latest six listings you opened on this device.</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-brand-primary hover:text-brand-primaryStrong"
        >
          Clear list
        </button>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((property) => (
          <article
            key={property.id}
            className="flex gap-3 rounded-2xl border border-brand-outline/40 bg-surface px-3 py-3 text-sm text-textc shadow-sm"
          >
            <div className="relative h-20 w-24 overflow-hidden rounded-xl bg-neutral-100">
              {property.image ? (
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  sizes="120px"
                  className="object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] text-neutral-500">
                  No photo
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <Link
                href={`/property/${property.slug ?? property.id}`}
                className="font-semibold text-brand-dark hover:text-brand-primary"
              >
                {property.title}
              </Link>
              <p className="text-xs text-text-muted">{property.city}</p>
              <p className="text-sm font-semibold text-brand-dark">{formatCurrency(property.price)}/mo</p>
              <p className="text-xs text-text-muted">
                {property.beds} bd • {property.baths} ba • {property.type}
              </p>
            </div>
          </article>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <ClockIcon className="h-4 w-4" aria-hidden="true" />
        Synced locally. Clear history if you are on a shared computer.
      </div>
    </section>
  );
}
