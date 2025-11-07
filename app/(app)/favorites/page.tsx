import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import PropertyCard from "@/components/PropertyCard";
import { buttonStyles } from "@/components/ui/button";
import { listFavoriteProperties } from "@/lib/data-access/favorites";
import { getCurrentUser } from "@/lib/data-access/profile";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Saved homes - Rento",
  description: "Review and organize the rental listings you've favorited."
};

export default async function FavoritesPage() {
  if (!hasSupabaseEnv) {
    return (
      <EmptyState
        title="Connect Supabase to sync favorites"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load saved homes for your account."
      />
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return (
      <EmptyState
        title="Sign in to view favorites"
        description="Save listings as you browse so they’re easy to compare later."
        action={
          <Link href="/auth/sign-in" className={buttonStyles({ variant: "primary", size: "md" })}>
            Sign in
          </Link>
        }
      />
    );
  }

  const favorites = await listFavoriteProperties(48);
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
            <PropertyCard property={{ ...property, isFavorite: true }} />
          </div>
        ))}
      </div>
    </div>
  );
}
