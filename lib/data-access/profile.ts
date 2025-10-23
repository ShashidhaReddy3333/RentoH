import { hasSupabaseEnv } from "@/lib/env";
import { mockCurrentUser, mockProfile, setMockProfile } from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

const CURRENT_USER_ID = "user_current";

type SupabaseProfileRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  prefs?: Profile["prefs"] | null;
  notifications?: Profile["notifications"] | null;
  verification_status?: Profile["verificationStatus"] | null;
};

export async function getProfile(): Promise<Profile> {
  if (hasSupabaseEnv) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            name,
            email,
            phone,
            avatar_url,
            prefs,
            notifications,
            verification_status
          `
        )
        .eq("id", CURRENT_USER_ID)
        .single();

      if (!error && data) {
        return mapProfileFromSupabase(data);
      }
    } catch (error) {
      console.warn("[profile] Falling back to mock profile", error);
    }
  }

  return clone(mockProfile);
}

export async function getCurrentUser(): Promise<{ id: string; role: UserRole } | null> {
  if (hasSupabaseEnv) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        const metadataRole = data.user.user_metadata?.["role"];
        const role = (metadataRole as UserRole | undefined) ?? "tenant";
        return { id: data.user.id, role };
      }
    } catch (error) {
      console.warn("[profile] Unable to fetch current user", error);
    }
  }

  return mockCurrentUser;
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  if (hasSupabaseEnv) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("profiles")
        .update(mapProfileToSupabase(patch))
        .eq("id", CURRENT_USER_ID)
        .select(
          `
            id,
            name,
            email,
            phone,
            avatar_url,
            prefs,
            notifications,
            verification_status
          `
        )
        .single();

      if (!error && data) {
        return mapProfileFromSupabase(data);
      }
    } catch (error) {
      console.warn("[profile] Falling back to mock profile update", error);
    }
  }

  const nextProfile: Profile = {
    ...mockProfile,
    ...patch,
    prefs: { ...mockProfile.prefs, ...patch.prefs },
    notifications: { ...mockProfile.notifications, ...patch.notifications }
  };

  setMockProfile(nextProfile);
  return clone(nextProfile);
}

function mapProfileFromSupabase(record: SupabaseProfileRow): Profile {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone ?? undefined,
    avatarUrl: record.avatar_url ?? undefined,
    prefs: record.prefs ?? {},
    notifications: record.notifications ?? {
      newMatches: true,
      messages: true,
      applicationUpdates: true
    },
    verificationStatus: record.verification_status ?? "unverified"
  };
}

function mapProfileToSupabase(patch: Partial<Profile>) {
  const payload: Record<string, unknown> = {};

  if (patch.name !== undefined) payload["name"] = patch.name;
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

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}
