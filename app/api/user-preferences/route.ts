import { NextResponse, type NextRequest } from "next/server";
import { validateAuthRequest, handleAuthError } from "@/lib/http/auth";
import { HttpError } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await validateAuthRequest(request, { requireCsrf: false });
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) throw new HttpError(401, "Authentication required", "AUTH_REQUIRED");

    const { data, error } = await supabase!
      .from("user_preferences")
      .select("email_notifications, sms_notifications")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw new HttpError(500, "Failed to load preferences", "PREF_ERROR");

    if (!data) {
      // Fallback: return defaults or existing profile.notifications
      const { data: profileData } = await supabase!
        .from("profiles")
        .select("notifications")
        .eq("id", user.id)
        .maybeSingle();

      const notifications = profileData?.notifications ?? { newMatches: true, messages: true, applicationUpdates: true };
      const response = {
        emailNotifications: {
          newMessages: notifications.messages ?? true,
          applications: notifications.applicationUpdates ?? true,
          tours: notifications.newMatches ?? true
        },
        smsNotifications: { newMessages: false, applications: false, tours: false }
      };

      return NextResponse.json(response);
    }

    return NextResponse.json({
      emailNotifications: data.email_notifications,
      smsNotifications: data.sms_notifications
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { body, supabase } = await validateAuthRequest(request);
    const prefs = body;
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) throw new HttpError(401, "Authentication required", "AUTH_REQUIRED");

    type Payload = {
      user_id: string;
      updated_at: string;
      email_notifications?: object;
      sms_notifications?: object;
    };
    const payload: Payload = {
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    if (prefs.emailNotifications !== undefined) payload.email_notifications = prefs.emailNotifications;
    if (prefs.smsNotifications !== undefined) payload.sms_notifications = prefs.smsNotifications;

    const { error } = await supabase!
      .from("user_preferences")
      .upsert(payload, { onConflict: "user_id" });

    if (error) throw new HttpError(500, "Failed to save preferences", "PREF_SAVE_ERROR");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
