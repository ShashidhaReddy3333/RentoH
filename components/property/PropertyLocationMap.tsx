"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { MapPinIcon } from "@heroicons/react/24/solid";
import Map, { Marker, NavigationControl } from "react-map-gl";

type PropertyLocationMapProps = {
  coordinates: { lat: number; lng: number };
  address?: string;
  mapboxToken?: string | null;
};

export function PropertyLocationMap({ coordinates, address, mapboxToken }: PropertyLocationMapProps) {
  if (!mapboxToken) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-brand-teal/40 bg-brand-teal/10 text-sm text-brand-teal">
        Map preview requires a Mapbox access token.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-black/5 shadow-soft" aria-label="Map location">
      <div className="map-container h-72 w-full lg:h-96">
        <Map
          initialViewState={{
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            zoom: 14
          }}
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          <NavigationControl position="top-left" visualizePitch />
          <Marker latitude={coordinates.lat} longitude={coordinates.lng} anchor="bottom">
            <span className="inline-flex h-9 w-9 -translate-y-2 transform items-center justify-center rounded-full bg-brand-teal text-white shadow-soft">
              <MapPinIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </Marker>
        </Map>
      </div>
      {address ? (
        <div className="border-t border-black/5 bg-white/90 p-4 text-sm font-medium text-brand-dark">
          {address}
        </div>
      ) : null}
    </div>
  );
}

