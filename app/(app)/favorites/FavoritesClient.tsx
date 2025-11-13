"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import EmptyState from "@/components/EmptyState";
import PropertyCard from "@/components/PropertyCard";
import { buttonStyles } from "@/components/ui/button";
import type { Property } from "@/lib/types";

type FavoritesClientProps = {
  initialFavorites: Property[];
};

export default function FavoritesClient({ initialFavorites }: FavoritesClientProps) {
  const [favorites, setFavorites] = useState<Property[]>(initialFavorites);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/favorites/list");
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to load favorites");
      }
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error("[favorites] Refresh failed", err);
      setError(err instanceof Error ? err.message : "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleFavorite = useCallback((isSaved: boolean, propertyId?: string) => {
    if (!isSaved && propertyId) {
      setFavorites((prev) => prev.filter((property) => property.id !== propertyId));
    } else {
      void refresh();
    }
  }, [refresh]);

  if (loading) {
    return (
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-brand-dark">Your saved homes</h1>
          <p className="text-sm text-text-muted">
            Loading your favorites...
          </p>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load favorites"
        description={error}
        action={
          <button
            onClick={() => refresh()}
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            Try again
          </button>
        }
      />
    );
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        title="Save homes to build your shortlist"
        description="Tap the heart icon on any listing to collect your top picks in one place."
        action={
          <Link href="/browse" className={buttonStyles({ variant: "primary", size: "md" })}>
            Browse homes
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Your saved homes</h1>
        <p className="text-sm text-text-muted">
          Compare pricing, availability, and amenities for the listings you favourited.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {favorites.map((property) => (
          <div key={property.id} className="h-full">
            <PropertyCard 
              property={property} 
              onToggleFavorite={(isSaved) => handleToggleFavorite(isSaved, property.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
