"use client";

import { useEffect, useRef } from "react";
import type { Property } from "@/lib/types";
import { env } from "@/lib/env";

type MapboxMapProps = {
  properties: Property[];
};

/**
 * Mapbox GL map component - only loaded when needed
 * This component is dynamically imported to avoid loading mapbox-gl bundle upfront
 */
export default function MapboxMap({ properties }: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxToken = env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    // Only load mapbox-gl if we have a token and container
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) {
      return;
    }

    // Dynamically import mapbox-gl and its CSS to avoid loading in the main bundle
    Promise.all([
      import("mapbox-gl"),
      import("mapbox-gl/dist/mapbox-gl.css")
    ]).then(([mapboxgl]) => {
      if (!mapContainerRef.current) return;

      mapboxgl.accessToken = mapboxToken;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-79.3832, 43.6532], // Default to Toronto
        zoom: 11
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add markers for properties with coordinates
      properties.forEach((property) => {
        if (property.coordinates) {
          const { lat, lng } = property.coordinates;
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <h3 class="font-semibold text-sm">${property.title}</h3>
              <p class="text-xs text-gray-600">$${property.price.toLocaleString()}/mo</p>
            </div>`
          );

          new mapboxgl.Marker({ color: "#0EA5E9" })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);
        }
      });

      // Fit map to markers if we have properties with coordinates
      const coordinates = properties
        .filter((p) => p.coordinates)
        .map((p) => [p.coordinates!.lng, p.coordinates!.lat] as [number, number]);

      if (coordinates.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));

        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14
        });
      } else if (coordinates.length === 1 && coordinates[0]) {
        map.setCenter(coordinates[0] as [number, number]);
        map.setZoom(13);
      }

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapboxToken, properties]);

  // Show placeholder if no mapbox token
  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-blue/15 via-brand-teal/20 to-brand-green/15">
        <div className="max-w-md text-center p-6">
          <h3 className="text-lg font-semibold text-brand-dark mb-2">Map View Unavailable</h3>
          <p className="text-sm text-text-muted">
            Configure <code className="text-xs bg-white/50 px-1 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable interactive maps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="h-full w-full rounded-3xl" />
  );
}
