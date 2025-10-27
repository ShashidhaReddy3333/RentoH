"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Property } from "@/lib/types";

// Lazy-load mapbox-gl with ssr: false
const MapboxMap = dynamic(() => import("./mapbox-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-3xl bg-gradient-to-br from-brand-blue/15 via-brand-teal/20 to-brand-green/15" />
  )
});

type ListingsMapProps = {
  properties: Property[];
};

/**
 * Optimized listings map that lazy-loads mapbox-gl only when:
 * 1. User clicks "Map" view
 * 2. Map container enters viewport (intersection observer)
 */
export default function ListingsMap({ properties }: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Use Intersection Observer to detect when map enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load map when visible
  useEffect(() => {
    if (isVisible && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isVisible, shouldLoad]);

  return (
    <div
      ref={containerRef}
      className="relative h-[420px] overflow-hidden rounded-3xl border border-black/5"
    >
      {shouldLoad ? (
        <MapboxMap properties={properties} />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-blue/15 via-brand-teal/20 to-brand-green/15">
          <div className="text-center">
            <div className="mb-2 text-sm font-semibold text-brand-dark">Map View</div>
            <div className="text-xs text-text-muted">Scroll down to load map</div>
          </div>
        </div>
      )}
    </div>
  );
}
