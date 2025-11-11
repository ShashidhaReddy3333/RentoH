"use client";

import Link from "next/link";
import { useCallback } from "react";

import EmptyState from "@/components/EmptyState";
import PropertyCard from "@/components/PropertyCard";
import { buttonStyles } from "@/components/ui/button";
import { useFavorites } from "@/lib/hooks/useFavorites";

export default function FavoritesClient() {
  const { favorites, loading, error, refresh } = useFavorites();

  const handleToggleFavorite = useCallback((isSaved: boolean) => {
    // Refresh the favorites list when a favorite is toggled
    if (!isSaved) {
      // If unfavorited, refresh to remove from list
      setTimeout(() => refresh(), 500);
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
            onClick={refresh}
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
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
