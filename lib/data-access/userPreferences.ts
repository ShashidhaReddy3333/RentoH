import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";

export type UserPreferences = {
  emailNotifications: {
    newMessages: boolean;
    applications: boolean;
    tours: boolean;
  };
  smsNotifications: {
    newMessages: boolean;
    applications: boolean;
    tours: boolean;
  };
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: {
    newMessages: true,
    applications: true,
    tours: true
  },
  smsNotifications: {
    newMessages: false,
    applications: false,
    tours: false
  }
};

export async function getUserPreferencesForUserId(userId: string): Promise<UserPreferences | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("email_notifications, sms_notifications")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[userPreferences] failed to load", error);
    return null;
  }

  if (!data) return null;

  return {
    emailNotifications: data.email_notifications ?? DEFAULT_PREFERENCES.emailNotifications,
    smsNotifications: data.sms_notifications ?? DEFAULT_PREFERENCES.smsNotifications
  };
}

export async function getCurrentUserPreferences(): Promise<UserPreferences | null> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("email_notifications, sms_notifications")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[userPreferences] failed to load", error);
    return null;
  }

  if (!data) return DEFAULT_PREFERENCES;

  return {
    emailNotifications: data.email_notifications ?? DEFAULT_PREFERENCES.emailNotifications,
    smsNotifications: data.sms_notifications ?? DEFAULT_PREFERENCES.smsNotifications
  };
}

export async function upsertCurrentUserPreferences(prefs: Partial<UserPreferences>) {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) throw new Error("Supabase client unavailable.");

  const payload: any = {};
  if (prefs.emailNotifications !== undefined) payload.email_notifications = prefs.emailNotifications;
  if (prefs.smsNotifications !== undefined) payload.sms_notifications = prefs.smsNotifications;
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, ...payload }, { onConflict: "user_id" })
    .select("email_notifications, sms_notifications")
    .maybeSingle();

  if (error) {
    console.error("[userPreferences] upsert failed", error);
    throw error;
  }

  return {
    emailNotifications: data?.email_notifications ?? DEFAULT_PREFERENCES.emailNotifications,
    smsNotifications: data?.sms_notifications ?? DEFAULT_PREFERENCES.smsNotifications
  } as UserPreferences;
}
