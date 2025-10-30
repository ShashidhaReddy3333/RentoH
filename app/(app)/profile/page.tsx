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

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    const meta = user.user_metadata ?? {};
    const normalize = (value?: unknown) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };

    const { data: inserted } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: (meta.full_name as string | undefined) ?? user.email ?? "",
          email: user.email ?? "",
          phone: (meta.phone as string | undefined) ?? "",
          user_type: (meta.user_type as string | undefined) ?? "tenant",
          city: normalize(meta.city),
          address: normalize(meta.address),
          contact_method: normalize(meta.contact_method),
          dob: normalize(meta.dob),
          photo_url: normalize(meta.photo_url)
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (inserted) {
      profile = inserted;
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Your profile</h1>
      <ProfileForm initialProfile={profile ?? null} email={user.email ?? ""} />
    </div>
  );
}
