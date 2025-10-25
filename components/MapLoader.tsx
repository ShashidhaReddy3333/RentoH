"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { buttonStyles } from "@/components/ui/button"; // Keep buttonStyles as it's used

const PropertyLocationMap = dynamic(
  () => import("@/components/property/PropertyLocationMap").then((mod) => mod.PropertyLocationMap),
  { ssr: false }
);

export default function MapLoader({
  coordinates,
  address,
  mapboxToken
}: {
  coordinates: { lat: number; lng: number };
  address?: string | null;
  mapboxToken?: string | null;
}) {
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-text-muted">Explore the neighbourhood around this home.</div>
        <button
          type="button"
          className={buttonStyles({ variant: "ghost", size: "md" })}
          onClick={() => setShow(true)}
        >
          Show map
        </button>
      </div>
    );
  }

  return (
    <PropertyLocationMap coordinates={coordinates} address={address ?? undefined} mapboxToken={mapboxToken ?? undefined} />
  );
}
