import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPreferencesForUserId, DEFAULT_PREFERENCES } from "@/lib/data-access/userPreferences";

type DigestOpts = { trigger?: string };

type MessageRow = { id: string; thread_id: string; sender_id: string; body: string; created_at: string };
type ApplicationRow = { id: string; property_id: string; tenant_id: string; message: string; submitted_at: string; status: string };

export async function generateDigestForUser(userId: string, opts: DigestOpts = {}) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    console.warn("[digest] supabase server client unavailable");
    return null;
  }

  // Load preferences (fall back to defaults)
  const prefs = (await getUserPreferencesForUserId(userId)) ?? DEFAULT_PREFERENCES;

  // Decide whether to generate digest based on trigger and preferences
  const trigger = opts.trigger ?? "manual";

  if (trigger === "message" && !prefs.emailNotifications.newMessages) {
    console.log(`[digest] user=${userId} has disabled email newMessages - skipping`);
    return null;
  }

  if (trigger === "application" && !prefs.emailNotifications.applications) {
    console.log(`[digest] user=${userId} has disabled email applications - skipping`);
    return null;
  }

  // Gather recent items (simple heuristic: last 24 hours)
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Messages: fetch messages from threads involving the user
  const { data: threads } = await supabase
    .from("message_threads")
    .select("id")
    .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`);

  const threadIds = threads?.map((t: { id: string }) => t.id) ?? [];

  let recentMessages: MessageRow[] = [];
  if (threadIds.length > 0 && prefs.emailNotifications.newMessages) {
    const { data: messages } = await supabase
      .from("messages")
      .select("id, thread_id, sender_id, body, created_at")
      .in("thread_id", threadIds)
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20); // Limit to 20 messages
    recentMessages = messages ?? [];
  }

  // Applications: fetch recent applications addressed to this user
  let recentApplications: ApplicationRow[] = [];
  if (prefs.emailNotifications.applications) {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, property_id, tenant_id, message, submitted_at, status")
      .eq("landlord_id", userId)
      .gt("submitted_at", since)
      .order("submitted_at", { ascending: false })
      .limit(20); // Limit to 20 applications
    recentApplications = apps ?? [];
  }

  const digest = {
    userId,
    trigger,
    timestamp: new Date().toISOString(),
    messagesCount: recentMessages.length,
    applicationsCount: recentApplications.length,
    messages: recentMessages,
    applications: recentApplications
  };

  // Stubbed integration: log digest. In production, send an email/SMS honoring prefs.
  console.log("[digest] Generated digest for user:", JSON.stringify(digest, null, 2));

  // TODO: enqueue/send via email provider if desired.
  return digest;
}
