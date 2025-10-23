import { hasSupabaseEnv } from "@/lib/env";
import {
  addMockThread,
  appendMockMessage,
  mockMessages,
  mockThreads,
  updateMockThread
} from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Message, MessageThread } from "@/lib/types";

const CURRENT_USER_ID = "user_current";

type SupabaseThreadRow = {
  id: string;
  other_party_name?: string | null;
  other_party_avatar?: string | null;
  last_message?: string | null;
  unread_count?: number | null;
  updated_at?: string | null;
};

type SupabaseMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  created_at?: string | null;
};

export async function listThreads(): Promise<MessageThread[]> {
  if (hasSupabaseEnv) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("message_threads")
        .select(
          `
            id,
            other_party_name,
            other_party_avatar,
            last_message,
            unread_count,
            updated_at
          `
        )
        .order("updated_at", { ascending: false });

      if (!error && data) {
        return data.map(mapThreadFromSupabase);
      }
    } catch (error) {
      console.warn("[messages] Falling back to mock threads", error);
    }
  }

  return [...mockThreads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getThreadMessages(threadId: string): Promise<Message[]> {
  if (hasSupabaseEnv) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("messages")
        .select("id,thread_id,sender_id,text,created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        return data.map(mapMessageFromSupabase);
      }
    } catch (error) {
      console.warn("[messages] Falling back to mock thread messages", error);
    }
  }

  return mockMessages
    .filter((message) => message.threadId === threadId)
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export async function sendMessage(threadId: string, text: string): Promise<Message> {
  if (!text.trim()) {
    throw new Error("Message text is required.");
  }

  if (hasSupabaseEnv) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("messages")
        .insert({
          thread_id: threadId,
          sender_id: CURRENT_USER_ID,
          text: text.trim()
        })
        .select("id,thread_id,sender_id,text,created_at")
        .single();

      if (!error && data) {
        const message = mapMessageFromSupabase(data);
        await supabase
          .from("message_threads")
          .update({
            last_message: message.text,
            updated_at: message.createdAt,
            unread_count: 0
          })
          .eq("id", threadId);

        return message;
      }
    } catch (error) {
      console.warn("[messages] Falling back to mock send", error);
    }
  }

  const message: Message = {
    id: `msg_${Date.now()}`,
    threadId,
    senderId: CURRENT_USER_ID,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  appendMockMessage(message);
  updateThreadWithMessage(threadId, message);

  return message;
}

function mapThreadFromSupabase(record: SupabaseThreadRow): MessageThread {
  return {
    id: record.id,
    otherPartyName: record.other_party_name ?? "Conversation",
    otherPartyAvatar: record.other_party_avatar ?? undefined,
    lastMessage: record.last_message ?? undefined,
    unreadCount: typeof record.unread_count === "number" ? record.unread_count : 0,
    updatedAt: record.updated_at ?? new Date().toISOString()
  };
}

function mapMessageFromSupabase(record: SupabaseMessageRow): Message {
  return {
    id: record.id,
    threadId: record.thread_id,
    senderId: record.sender_id,
    text: record.text,
    createdAt: record.created_at ?? new Date().toISOString()
  };
}

function updateThreadWithMessage(threadId: string, message: Message) {
  const now = message.createdAt;
  const existing = mockThreads.find((thread) => thread.id === threadId);

  if (!existing) {
    addMockThread({
      id: threadId,
      otherPartyName: "New conversation",
      unreadCount: 0,
      lastMessage: message.text,
      updatedAt: now
    });
    return;
  }

  updateMockThread(threadId, (thread) => ({
    ...thread,
    lastMessage: message.text,
    unreadCount: 0,
    updatedAt: now
  }));
}
