"use client";

import { useMemo } from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";

import type { Property } from "@/lib/types";

type MapPaneProps = {
  properties: Property[];
};

export default function MapPane({ properties }: MapPaneProps) {
  const items = useMemo(
    () =>
      properties.slice(0, 8).map((property) => ({
        id: property.id,
        label: property.title,
        price: property.price
      })),
    [properties]
  );

  return (
    <section
      aria-label="Map view"
      className="relative h-[420px] overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-br from-brand-blue/15 via-brand-teal/20 to-brand-green/15"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.85)_0%,_rgba(255,255,255,0)_65%)]" />
      <div className="relative flex h-full flex-col justify-between p-6">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-brand-dark">Map preview</h2>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-brand-teal shadow-sm">
            Live map coming soon
          </span>
        </header>
        <div className="grid gap-3">
          {items.map((property) => (
            <div
              key={property.id}
              className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 backdrop-blur transition hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-white shadow-sm">
                  <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="max-w-[160px] truncate text-sm font-medium text-brand-dark">
                  {property.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-brand-blue">
                ${property.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted">
          Pins are illustrative. Connect Supabase + Mapbox to preview real homes.
        </p>
      </div>
    </section>
  );
}
