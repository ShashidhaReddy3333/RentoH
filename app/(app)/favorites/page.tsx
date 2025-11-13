import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/data-access/profile";
import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import FavoritesClient from "./FavoritesClient";
import { listFavoriteProperties } from "@/lib/data-access/favorites";

export const metadata: Metadata = {
  title: "Saved homes - Rento",
  description: "Review and organize the rental listings you've favorited."
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in?redirect=/favorites");
  }
  const favorites = await listFavoriteProperties(60);

  return (
    <div className="space-y-6">
      <SupabaseConfigBanner />
      <FavoritesClient initialFavorites={favorites} />
    </div>
  );
}
