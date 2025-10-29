import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import ProfileForm from "./profile-client";

export const metadata: Metadata = {
  title: "Profile - Rento",
  description: "Manage your renter profile, preferences, and notifications."
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return <div className="p-6">Supabase not configured.</div>;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-6">Please sign in to view your profile.</div>;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Your profile</h1>
      <ProfileForm initialProfile={profile ?? null} email={user.email ?? ""} />
    </div>
  );
}
