"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { format, formatDistanceToNowStrict, isSameDay, parseISO } from "date-fns";
import type { RealtimePresenceState } from "@supabase/supabase-js";

import Bubble from "@/components/messages/Bubble";
import DayDivider from "@/components/messages/DayDivider";
import type { Message } from "@/lib/types";
import type { ThreadPresence } from "@/lib/realtime/thread-presence";
import { setupThreadPresence } from "@/lib/realtime/thread-presence";

type ChatThreadProps = {
  messages: Message[];
  currentUserId?: string;
  threadId?: string;
  loading?: boolean;
  onStatusChange?: (status?: string) => void;
};

type GroupedMessage = {
  day: string;
  date: Date;
  items: Message[];
};

export default function ChatThread({
  messages,
  currentUserId,
  threadId,
  loading = false,
  onStatusChange
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [presenceByUser, setPresenceByUser] = useState<Record<string, ThreadPresence>>({});

  const scrollToBottom = useCallback(
    (smooth = true) => {
      endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    },
    []
  );

  useEffect(() => {
    scrollToBottom(false);
  }, [threadId, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 120;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < threshold) {
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!currentUserId || !threadId) return;

    const presence = setupThreadPresence(threadId, currentUserId);
    void presence.join();

    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<RealtimePresenceState<ThreadPresence>>;
      const state = customEvent.detail;
      const presenceMap: Record<string, ThreadPresence> = {};
      const typing = new Set<string>();

      Object.values(state).forEach((presences) => {
        presences.forEach((p) => {
          presenceMap[p.userId] = p;
          if (p.isTyping) {
            typing.add(p.userId);
          }
        });
      });

      setPresenceByUser(presenceMap);
      setTypingUsers(typing);
    };

    const handleInput = debounce((event: Event) => {
      const textarea = event.target as HTMLTextAreaElement;
      void presence.updateTypingStatus(Boolean(textarea.value.trim()));
    }, 400);

    window.addEventListener("thread:presence:sync", handleSync);
    const inputEl = document.querySelector<HTMLTextAreaElement>("[data-testid=message-input]");
    inputEl?.addEventListener("input", handleInput);

    return () => {
      presence.leave();
      window.removeEventListener("thread:presence:sync", handleSync);
      inputEl?.removeEventListener("input", handleInput);
    };
  }, [currentUserId, threadId]);

  useEffect(() => {
    if (!currentUserId || !threadId) return;
    const presence = setupThreadPresence(threadId, currentUserId);
    void presence.updateReadStatus();
  }, [messages, currentUserId, threadId]);

  useEffect(() => {
    if (!onStatusChange) return;
    if (typingUsers.size > 0) {
      onStatusChange(typingUsers.size === 1 ? "typing..." : "multiple people typing...");
      return;
    }

    const others = Object.values(presenceByUser).filter((presence) => presence.userId !== currentUserId);
    if (others.length === 0) {
      onStatusChange(undefined);
      return;
    }

    const lastSeen = others
      .map((presence) => presence.lastSeen)
      .filter(Boolean)
      .sort()
      .reverse()[0];

    if (lastSeen) {
      try {
        onStatusChange(`Last seen ${formatDistanceToNowStrict(parseISO(lastSeen), { addSuffix: true })}`);
      } catch {
        onStatusChange(undefined);
      }
    } else {
      onStatusChange(undefined);
    }
  }, [typingUsers, presenceByUser, onStatusChange, currentUserId]);

  const groupedMessages = useMemo<GroupedMessage[]>(() => {
    if (!messages.length) return [];
    return messages.reduce<GroupedMessage[]>((acc, message) => {
      const createdAt = message.createdAt ? parseISO(message.createdAt) : new Date();
      const day = format(createdAt, "PPP");

      const lastGroup = acc[acc.length - 1];
      if (lastGroup && isSameDay(lastGroup.date, createdAt)) {
        lastGroup.items.push(message);
        return acc;
      }

      acc.push({ day, date: createdAt, items: [message] });
      return acc;
    }, []);
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      data-testid="chat-thread"
    >
      {loading ? (
        <p className="text-sm text-slate-500">Loading messages...</p>
      ) : (
        groupedMessages.map((group) => (
          <section key={group.date.toISOString()} aria-label={group.day}>
            <DayDivider label={group.day} />
            <div className="flex flex-col gap-3">
              {group.items.map((message, index) => {
                const createdAt = message.createdAt ? parseISO(message.createdAt) : new Date();
                const timeDisplay = format(createdAt, "p");
                const status =
                  message.senderId === currentUserId
                    ? message.readAt
                      ? "read"
                      : "sent"
                    : undefined;
                const isLastMessage =
                  group === groupedMessages[groupedMessages.length - 1] &&
                  index === group.items.length - 1;

                return (
                  <div key={message.id} ref={isLastMessage ? endRef : undefined}>
                    <Bubble
                      me={message.senderId === currentUserId}
                      text={message.text}
                      time={message.createdAt}
                      timeLabel={timeDisplay}
                      status={status}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
      {typingUsers.size > 0 ? (
        <p className="mt-4 text-xs text-slate-500" aria-live="assertive">
          {typingUsers.size === 1 ? "Someone is typing..." : "Multiple people are typing..."}
        </p>
      ) : null}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
