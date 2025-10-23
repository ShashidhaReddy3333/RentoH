"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { LngLatBoundsLike } from "mapbox-gl";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { clientEnv } from "@/lib/env";
import type { ListingSummary } from "@/lib/search/types";

type ListingsMapProps = {
  items: ListingSummary[];
  selectedId: string | null;
  onSelect: (listingId: string | null) => void;
  isLoading?: boolean;
};

const defaultCenter = {
  latitude: 43.4643,
  longitude: -80.5204,
  zoom: 10.5
};

const mapboxToken = clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN;

export function ListingsMap({ items, selectedId, onSelect, isLoading }: ListingsMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const listingsWithCoords = useMemo(
    () => items.filter((item) => typeof item.latitude === "number" && typeof item.longitude === "number"),
    [items]
  );

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (!listingsWithCoords.length) return;
    const bounds = computeBounds(listingsWithCoords);
    if (!bounds) return;

    try {
      mapRef.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        duration: 500
      });
    } catch {
      // Map may not be ready to fit; ignore
    }
  }, [listingsWithCoords, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (!selectedId) return;
    const target = listingsWithCoords.find((item) => item.id === selectedId);
    if (!target || target.latitude == null || target.longitude == null) return;
    try {
      mapRef.current.flyTo({
        center: [target.longitude, target.latitude],
        zoom: 13,
        duration: 600
      });
    } catch {
      // Ignore fly errors
    }
  }, [selectedId, listingsWithCoords, mapReady]);

  if (!mapboxToken) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <p className="font-medium">Map view requires a Mapbox access token.</p>
        <p className="text-xs">
          Set <code className="rounded bg-slate-800 px-1 py-0.5 text-white">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your
          environment to enable the interactive map.
        </p>
      </div>
    );
  }

  if (!listingsWithCoords.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/60 p-12 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <p className="font-medium">No geocoded listings to display yet.</p>
        <p className="mt-1 text-xs opacity-80">
          Listings will appear on the map once latitude and longitude data are available.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-slate-200 shadow-lg dark:border-slate-700">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: listingsWithCoords[0]?.latitude ?? defaultCenter.latitude,
          longitude: listingsWithCoords[0]?.longitude ?? defaultCenter.longitude,
          zoom: listingsWithCoords.length ? 11 : defaultCenter.zoom
        }}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        onLoad={() => setMapReady(true)}
        onMove={() => setUserInteracted(true)}
        onDrag={() => setUserInteracted(true)}
      >
        <NavigationControl position="bottom-right" showCompass />
        {listingsWithCoords.map((listing) => {
          const selected = listing.id === selectedId;
          return (
            <Marker
              key={listing.id}
              longitude={listing.longitude!}
              latitude={listing.latitude!}
              anchor="bottom"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                onSelect(listing.id);
              }}
            >
              <span
                className={clsx(
                  "flex h-10 w-10 -translate-y-2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-lg",
                  selected ? "bg-brand.primary" : "bg-brand.blue/90 hover:bg-brand.primary"
                )}
              >
                {formatPrice(listing.rent)}
              </span>
            </Marker>
          );
        })}
      </Map>
      {isLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-gradient-to-b from-white/80 to-white/0 pt-6 dark:from-slate-950/80 dark:to-slate-950/0">
          <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                        Updating map…
          </div>
        </div>
      ) : null}
      {userInteracted ? (
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white shadow">
          Click a pin to view details
        </p>
      ) : null}
    </div>
  );
}

function computeBounds(items: ListingSummary[]): LngLatBoundsLike | null {
  const coordinates = items
    .map((item) => {
      if (item.latitude == null || item.longitude == null) {
        return null;
      }
      return [item.longitude, item.latitude] as [number, number];
    })
    .filter((point): point is [number, number] => point !== null);

  if (!coordinates.length) return null;

  const longitudes = coordinates.map(([lng]) => lng);
  const latitudes = coordinates.map(([, lat]) => lat);

  const west = Math.min(...longitudes);
  const south = Math.min(...latitudes);
  const east = Math.max(...longitudes);
  const north = Math.max(...latitudes);

  return [
    [west, south],
    [east, north]
  ];
}

function formatPrice(value: number) {
  if (value >= 1000) {
    return `$${Math.round(value / 100) / 10}k`;
  }
  return `$${value}`;
}
