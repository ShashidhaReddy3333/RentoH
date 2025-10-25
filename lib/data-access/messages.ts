// Removed unused imports: hasSupabaseEnv, mockMessages, mockThreads
import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import type { Message, MessageThread } from "@/lib/types";

type SupabaseThreadRow = {
  id: string;
  other_party_id: string | null;
  other_party_name: string | null;
  other_party_avatar: string | null;
  last_message: string | null;
  unread_count: number | null;
  updated_at: string | null;
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
        other_party_id,
        other_party_name,
        other_party_avatar,
        last_message,
        unread_count,
        updated_at
      `
    )
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("[messages] Failed to load threads", error);
    return [];
  }

  return data.map(mapThreadFromSupabase);
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
      unread_count: 0,
      updated_at: data.created_at ?? new Date().toISOString()
    })
    .eq("id", threadId)
    .eq("owner_id", user.id);

  return mapMessageFromSupabase(data);
}

function mapThreadFromSupabase(record: SupabaseThreadRow): MessageThread {
  return {
    id: record.id,
    otherPartyName: record.other_party_name ?? "Conversation",
    otherPartyAvatar: record.other_party_avatar ?? undefined,
    lastMessage: record.last_message ?? undefined,
    unreadCount: Number.isFinite(record.unread_count) ? Number(record.unread_count) : 0,
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