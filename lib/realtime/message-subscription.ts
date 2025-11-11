"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Message } from "@/lib/types";

type MessageSubscriptionCallbacks = {
  onInsert?: (message: Message) => void;
  onUpdate?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
};

export function useMessageSubscription(
  threadId: string | undefined,
  callbacks: MessageSubscriptionCallbacks
) {
  useEffect(() => {
    if (!threadId) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      console.error("[realtime] Supabase client not available");
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`messages:thread:${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `thread_id=eq.${threadId}`
          },
          (payload) => {
            if (callbacks.onInsert && payload.new) {
              const raw = payload.new as {
                id: string;
                thread_id: string;
                sender_id: string;
                body: string;
                created_at?: string | null;
                read_at?: string | null;
              };
              
              const message: Message = {
                id: raw.id,
                threadId: raw.thread_id,
                senderId: raw.sender_id,
                text: raw.body,
                createdAt: raw.created_at ?? new Date().toISOString(),
                readAt: raw.read_at
              };
              
              callbacks.onInsert(message);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `thread_id=eq.${threadId}`
          },
          (payload) => {
            if (callbacks.onUpdate && payload.new) {
              const raw = payload.new as {
                id: string;
                thread_id: string;
                sender_id: string;
                body: string;
                created_at?: string | null;
                read_at?: string | null;
              };
              
              const message: Message = {
                id: raw.id,
                threadId: raw.thread_id,
                senderId: raw.sender_id,
                text: raw.body,
                createdAt: raw.created_at ?? new Date().toISOString(),
                readAt: raw.read_at
              };
              
              callbacks.onUpdate(message);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "messages",
            filter: `thread_id=eq.${threadId}`
          },
          (payload) => {
            if (callbacks.onDelete && payload.old) {
              const raw = payload.old as { id: string };
              callbacks.onDelete(raw.id);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(`[realtime] Subscribed to messages for thread ${threadId}`);
          } else if (status === "CHANNEL_ERROR") {
            console.error(`[realtime] Failed to subscribe to messages for thread ${threadId}`);
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [threadId, callbacks]);
}
