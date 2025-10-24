import type { User } from "@supabase/supabase-js";

import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import type { Profile, UserRole } from "@/lib/types";

type SupabaseProfileRow = {
  id: string;
  full_name?: string | null;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  prefs?: Profile["prefs"] | null;
  notifications?: Profile["notifications"] | null;
  verification_status?: Profile["verificationStatus"] | null;
  role?: UserRole | null;
};

export async function getProfile(): Promise<Profile | null> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        email,
        phone,
        avatar_url,
        prefs,
        notifications,
        verification_status,
        role
      `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[profile] Failed to load profile", error);
    return null;
  }

  if (!data) {
    return {
      id: user.id,
      name: user.email?.split("@")[0] ?? "Renter",
      email: user.email ?? "unknown@example.com",
      prefs: {},
      notifications: {
        newMatches: true,
        messages: true,
        applicationUpdates: true
      },
      verificationStatus: "pending"
    };
  }

  return mapProfileFromSupabase(data);
}

export async function getCurrentUser(): Promise<{ id: string; role: UserRole } | null> {
  const { user } = await getSupabaseClientWithUser();
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    role: resolveRole(user)
  };
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    throw new Error("Supabase client unavailable. Check your Supabase configuration.");
  }

  const payload = mapProfileToSupabase(patch);
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select(
      `
        id,
        full_name,
        email,
        phone,
        avatar_url,
        prefs,
        notifications,
        verification_status,
        role
      `
    )
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Profile update failed.");
  }

  return mapProfileFromSupabase(data);
}

export async function deleteAccount(): Promise<void> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    throw new Error("Supabase client unavailable. Check your Supabase configuration.");
  }

  const { error } = await supabase.from("profiles").delete().eq("id", user.id);
  if (error) {
    throw error;
  }
}

function mapProfileFromSupabase(record: SupabaseProfileRow): Profile {
  return {
    id: record.id,
    name: record.full_name ?? record.email.split("@")[0] ?? "Renter",
    email: record.email,
    phone: record.phone ?? undefined,
    avatarUrl: record.avatar_url ?? undefined,
    prefs: record.prefs ?? {},
    notifications:
      record.notifications ??
      {
        newMatches: true,
        messages: true,
        applicationUpdates: true
      },
    verificationStatus: record.verification_status ?? "pending"
  };
}

function mapProfileToSupabase(patch: Partial<Profile>) {
  const payload: Record<string, unknown> = {};

  if (patch.name !== undefined) payload["full_name"] = patch.name;
  if (patch.email !== undefined) payload["email"] = patch.email;
  if (patch.phone !== undefined) payload["phone"] = patch.phone;
  if (patch.avatarUrl !== undefined) payload["avatar_url"] = patch.avatarUrl;
  if (patch.prefs !== undefined) payload["prefs"] = patch.prefs;
  if (patch.notifications !== undefined) payload["notifications"] = patch.notifications;
  if (patch.verificationStatus !== undefined) {
    payload["verification_status"] = patch.verificationStatus;
  }

  return payload;
}

function resolveRole(user: User): UserRole {
  const rawRole =
    (user.app_metadata?.["role"] as string | undefined) ??
    (user.user_metadata?.["role"] as string | undefined);
  if (rawRole === "landlord" || rawRole === "admin") {
    return rawRole;
  }
  return "tenant";
}
