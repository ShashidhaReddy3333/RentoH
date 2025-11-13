// Removed unused imports: hasSupabaseEnv, mockMessages, mockThreads
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import type { Message, MessageThread } from "@/lib/types";

type SupabaseThreadRow = {
  id: string;
  property_id: string;
  property: { title: string | null } | { title: string | null }[] | null;
  tenant_id: string;
  landlord_id: string;
  subject: string | null;
  last_message: string | null;
  unread_count: number | null;
  updated_at: string | null;
  tenant_profile:
    | { full_name: string | null; avatar_url: string | null }
    | { full_name: string | null; avatar_url: string | null }[]
    | null;
  landlord_profile:
    | { full_name: string | null; avatar_url: string | null }
    | { full_name: string | null; avatar_url: string | null }[]
    | null;
};

type SupabaseMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at?: string | null;
  read_at?: string | null;
};

export async function listThreads(): Promise<MessageThread[]> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    throw new Error("Supabase client unavailable.");
  }

  const { data, error } = await supabase
    .from("message_threads")
    .select(
      `
        id,
        property_id,
        property:properties ( title ),
        tenant_id,
        landlord_id,
        subject,
        last_message,
        unread_count,
        updated_at,
        tenant_profile:profiles!message_threads_tenant_id_fkey ( full_name, avatar_url ),
        landlord_profile:profiles!message_threads_landlord_id_fkey ( full_name, avatar_url )
      `
    )
    .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("[messages] Failed to load threads", error);
    return [];
  }

  const unreadMap = await loadUnreadCounts(supabase, data.map((row) => row.id), user.id);

  return data.map((row) => mapThreadFromSupabase(row, user.id, unreadMap[row.id]));
}

export async function getThreadMessages(threadId: string): Promise<Message[]> {
  if (!threadId) return [];

  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    throw new Error("Supabase client unavailable.");
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, thread_id, sender_id, body, created_at, read_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[messages] Failed to load conversation", error);
    return [];
  }

  return data.map(mapMessageFromSupabase);
}

export async function sendMessage(threadId: string, text: string): Promise<Message> {
  const content = text.trim();
  if (!content) {
    throw new Error("Message text is required.");
  }

  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    throw new Error("Supabase client unavailable. Check your Supabase configuration.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body: content
    })
    .select("id, thread_id, sender_id, body, created_at")
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Failed to send message.");
  }

  // Optimistically update the thread metadata.
  await supabase
    .from("message_threads")
    .update({
      last_message: content,
      updated_at: data.created_at ?? new Date().toISOString()
    })
    .eq("id", threadId);

  return mapMessageFromSupabase(data);
}

export async function hasUnreadThreads(): Promise<boolean> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    return false;
  }

  const { data, error } = await supabase
    .from("message_threads")
    .select("id")
    .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`);

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("[messages] Failed to check unread threads", error);
    }
    return false;
  }

  const unreadMap = await loadUnreadCounts(supabase, data.map((row) => row.id), user.id);
  return Object.values(unreadMap).some((count) => count > 0);
}

export async function markThreadAsRead(threadId: string): Promise<void> {
  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase || !user) {
    console.error("[messages] Cannot mark as read: Supabase client unavailable");
    return;
  }

  // Mark all messages in this thread that were sent by the other party as read
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[messages] Failed to mark thread as read", error);
  }

  // Reset the unread count for this thread
  await supabase
    .from("message_threads")
    .update({ unread_count: 0 })
    .eq("id", threadId)
    .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`);
}

function mapThreadFromSupabase(
  record: SupabaseThreadRow,
  currentUserId: string,
  unreadOverride?: number
): MessageThread {
  const tenantProfile = Array.isArray(record.tenant_profile)
    ? record.tenant_profile[0] ?? null
    : record.tenant_profile;
  const landlordProfile = Array.isArray(record.landlord_profile)
    ? record.landlord_profile[0] ?? null
    : record.landlord_profile;
  const isCurrentTenant = record.tenant_id === currentUserId;
  const otherProfile = isCurrentTenant ? landlordProfile : tenantProfile;
  const otherName = otherProfile?.full_name ?? (isCurrentTenant ? "Landlord" : "Tenant");

  return {
    id: record.id,
    propertyId: record.property_id,
    subject: record.subject ?? undefined,
    propertyTitle: Array.isArray(record.property)
      ? record.property[0]?.title ?? undefined
      : record.property?.title ?? undefined,
    otherPartyName: otherName,
    otherPartyAvatar: otherProfile?.avatar_url ?? undefined,
    lastMessage: record.last_message ?? undefined,
    unreadCount:
      unreadOverride ?? (Number.isFinite(record.unread_count) ? Number(record.unread_count) : 0),
    updatedAt: record.updated_at ?? new Date().toISOString()
  };
}

function mapMessageFromSupabase(record: SupabaseMessageRow): Message {
  return {
    id: record.id,
    threadId: record.thread_id,
    senderId: record.sender_id,
    text: record.body,
    createdAt: record.created_at ?? new Date().toISOString(),
    readAt: record.read_at
  };
}

type UnreadCountMap = Record<string, number>;
type UnreadCountRow = { thread_id: string | null };

async function loadUnreadCounts(
  supabase: SupabaseClient,
  threadIds: string[],
  currentUserId: string
): Promise<UnreadCountMap> {
  if (!threadIds.length) {
    return {};
  }

  const { data, error } = await supabase
    .from("messages")
    .select("thread_id")
    .in("thread_id", threadIds)
    .is("read_at", null)
    .neq("sender_id", currentUserId);

  if (error || !data) {
    console.error("[messages] Failed to load unread counts", error);
    return {};
  }

  return (data as UnreadCountRow[]).reduce<UnreadCountMap>((acc, row) => {
    if (!row.thread_id) return acc;
    acc[row.thread_id] = (acc[row.thread_id] ?? 0) + 1;
    return acc;
  }, {});
}
