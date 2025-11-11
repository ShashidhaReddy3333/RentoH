import type { Metadata } from "next";
import { redirect } from "next/navigation";

import EmptyState from "@/components/EmptyState";
import { getCurrentUser } from "@/lib/data-access/profile";
import { hasSupabaseEnv } from "@/lib/env";
import FavoritesClient from "./FavoritesClient";

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
    redirect("/auth/sign-in?redirect=/favorites");
  }

  return <FavoritesClient />;
}
