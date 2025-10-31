import type { Metadata } from "next";

import type { Profile } from "@/lib/types/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import ProfileForm from "./profile-client";

export const metadata: Metadata = {
  title: "Profile - Rento",
  description: "Manage your renter profile, preferences, and notifications."
};

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: Profile["role"] | null;
  prefs: Record<string, unknown> | null;
};

type ProfileFormData = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: Profile["role"];
  city: string | null;
  address: string | null;
  contact_method: Profile["contact_method"];
  dob: string | null;
  avatar_url: string | null;
};

type ProfileDetails = {
  city: string | null;
  address: string | null;
  contactMethod: Profile["contact_method"];
  dob: string | null;
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function sanitizeContact(value: unknown): Profile["contact_method"] {
  if (value === "email" || value === "phone" || value === "chat") {
    return value;
  }
  return null;
}

function resolveRole(raw: unknown): Profile["role"] {
  if (raw === "landlord") return "landlord";
  if (raw === "admin") return "admin";
  return "tenant";
}

function extractProfileDetails(prefs: Record<string, unknown> | null | undefined): ProfileDetails {
  if (!prefs || typeof prefs !== "object") {
    return { city: null, address: null, contactMethod: null, dob: null };
  }

  const section = (prefs["profile"] ?? null) as unknown;
  if (!section || typeof section !== "object") {
    return { city: null, address: null, contactMethod: null, dob: null };
  }

  const record = section as Record<string, unknown>;

  return {
    city: asString(record["city"]),
    address: asString(record["address"]),
    contactMethod: sanitizeContact(record["contactMethod"]),
    dob: asString(record["dob"])
  };
}

function mapProfileForForm(
  row: ProfileRow | null,
  fallback: { id: string; email: string }
): { formProfile: ProfileFormData; prefs: Record<string, unknown> } {
  const prefs =
    row?.prefs && typeof row.prefs === "object" && row.prefs !== null ? (row.prefs as Record<string, unknown>) : {};
  const details = extractProfileDetails(prefs);

  return {
    formProfile: {
      id: row?.id ?? fallback.id,
      full_name: row?.full_name ?? null,
      email: row?.email ?? fallback.email,
      phone: row?.phone ?? null,
      role: resolveRole(row?.role),
      city: details.city,
      address: details.address,
      contact_method: details.contactMethod,
      dob: details.dob,
      avatar_url: row?.avatar_url ?? null
    },
    prefs
  };
}

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return <div className="p-6">Supabase not configured.</div>;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-6">Please sign in to view your profile.</div>;
  }

  const fallback = {
    id: user.id,
    email: user.email ?? ""
  };

  const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  let profile = (profileRow as ProfileRow | null) ?? null;

  if (!profile) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const profileDetailsFromMeta = {
      city: asString(meta["city"]),
      address: asString(meta["address"]),
      contactMethod: sanitizeContact(meta["contact_method"]),
      dob: asString(meta["dob"])
    };

    const cleanedProfileDetails = Object.fromEntries(
      Object.entries(profileDetailsFromMeta).filter(([, value]) => value !== null)
    );

    const payload: Record<string, unknown> = {
      id: user.id,
      full_name: asString(meta["full_name"]) ?? fallback.email,
      email: fallback.email,
      phone: asString(meta["phone"]),
      role: resolveRole(meta["user_type"] ?? meta["role"]),
      avatar_url: asString(meta["avatar_url"])
    };

    if (Object.keys(cleanedProfileDetails).length > 0) {
      payload["prefs"] = { profile: cleanedProfileDetails };
    }

    const { data: inserted } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .maybeSingle();

    profile = (inserted as ProfileRow | null) ?? null;
  }

  const { formProfile, prefs } = mapProfileForForm(profile, fallback);

  return <ProfileForm initialProfile={formProfile} email={formProfile.email} initialPrefs={prefs} />;
}
