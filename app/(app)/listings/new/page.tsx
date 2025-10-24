import type { Metadata } from "next";

import { hasSupabaseEnv } from "@/lib/env";

import NewListingClient from "./NewListingClient";

export const metadata: Metadata = {
  title: "Add a new property - Rento",
  description:
    "Create a new rental listing with photos, pricing, and amenity details to share with renters."
};

export default function NewListingPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Add a new property</h1>
        <p className="text-sm text-text-muted">
          Store mocked listing data locally until Supabase is connected. All fields marked with an asterisk are required.
        </p>
      </header>
      <NewListingClient />
      {!hasSupabaseEnv && (
        <p className="text-xs text-text-muted">
          Supabase credentials are not configured, so submissions remain in-memory for testing purposes.
        </p>
      )}
    </div>
  );
}
