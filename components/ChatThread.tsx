"use client";

import { useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import type { RealtimePresenceState } from "@supabase/supabase-js";
import type { Message } from "@/lib/types";
import type { ThreadPresence } from "@/lib/realtime/thread-presence";
import { setupThreadPresence } from "@/lib/realtime/thread-presence";

type ChatThreadProps = {
  messages: Message[];
  loading?: boolean;
  currentUserId?: string;
};

export default function ChatThread({ messages, loading = false, currentUserId }: ChatThreadProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [presenceByUser, setPresenceByUser] = useState<Record<string, ThreadPresence>>({});

  useEffect(() => {
    if (!currentUserId || !messages[0]?.threadId) return;
    
    const presence = setupThreadPresence(messages[0].threadId, currentUserId);
    void presence.join();

    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<RealtimePresenceState<ThreadPresence>>;
      const state = customEvent.detail;
      const presenceMap: Record<string, ThreadPresence> = {};
      const typing = new Set<string>();

      Object.values(state).forEach(presences => {
        presences.forEach(p => {
          presenceMap[p.userId] = p;
          if (p.isTyping) typing.add(p.userId);
        });
      });

      setPresenceByUser(presenceMap);
      setTypingUsers(typing);
    };

    const handleInput = debounce((event: Event) => {
      const textarea = event.target as HTMLTextAreaElement;
      void presence.updateTypingStatus(textarea.value.length > 0);
    }, 500);

    window.addEventListener("thread:presence:sync", handleSync);
    document.querySelector("[data-testid=message-input]")?.addEventListener("input", handleInput);

    return () => {
      presence.leave();
      window.removeEventListener("thread:presence:sync", handleSync);
      document.querySelector("[data-testid=message-input]")?.removeEventListener("input", handleInput);
    };
  }, [currentUserId, messages[0]?.threadId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const lastMessage = lastMessageRef.current;
    if (!viewport || !lastMessage) return;
    
    lastMessage.scrollIntoView({ behavior: "smooth" });
    
    if (currentUserId) {
      const presence = setupThreadPresence(messages[0]?.threadId ?? "", currentUserId);
      void presence.updateReadStatus();
    }
  }, [messages.length, currentUserId, messages[0]?.threadId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        viewport.scrollTop -= 100;
        break;
      case "ArrowDown":
        e.preventDefault();
        viewport.scrollTop += 100;
        break;
      case "Home":
        e.preventDefault();
        viewport.scrollTop = 0;
        break;
      case "End":
        e.preventDefault();
        viewport.scrollTop = viewport.scrollHeight;
        break;
    }
  };

  return (
    <section 
      className="flex h-full flex-col rounded-3xl border border-black/5 bg-white shadow-soft"
      role="region"
      aria-label="Chat messages"
    >
      <header className="flex items-center justify-between border-b border-black/5 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-brand-dark">Conversation</h2>
          <p className="text-xs text-text-muted" aria-live="polite">
            {typingUsers.size > 0 
              ? `${typingUsers.size === 1 ? "Someone is" : "Multiple people are"} typing...`
              : "Messages are synced when Supabase is connected."}
          </p>
        </div>
      </header>
      <div
        ref={viewportRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation messages"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 space-y-4 overflow-y-auto px-6 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
      >
        {loading ? (
          <div className="flex flex-col gap-3" aria-label="Loading messages">
            <Bubble skeleton align="left" />
            <Bubble skeleton align="right" />
            <Bubble skeleton align="left" />
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <div 
                key={message.id}
                ref={idx === messages.length - 1 ? lastMessageRef : undefined}
                className="focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-teal rounded-xl"
              >
                <Bubble
                  align={message.senderId === currentUserId ? "right" : "left"}
                  text={message.text}
                  timestamp={message.createdAt}
                  readAt={message.readAt}
                  seen={presenceByUser[message.senderId]?.lastSeen !== undefined}
                />
              </div>
            ))}
            {typingUsers.size > 0 && (
              <div 
                className="flex items-center gap-2 text-sm text-text-muted"
                aria-live="polite"
                role="status"
              >
                <span className="animate-pulse">•••</span>
                {typingUsers.size === 1 ? "Someone is typing..." : "Multiple people are typing..."}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Bubble({
  align,
  text,
  timestamp,
  readAt,
  seen = false,
  skeleton = false
}: {
  align: "left" | "right";
  text?: string;
  timestamp?: string;
  readAt?: string | null;
  seen?: boolean;
  skeleton?: boolean;
}) {
  const baseClasses = "max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-soft sm:max-w-[65%]";

  const alignClass =
    align === "right"
      ? "ml-auto rounded-br-md bg-brand-teal text-white"
      : "mr-auto rounded-bl-md bg-surface text-brand-dark";

  const formattedTimestamp =
    timestamp &&
    new Date(timestamp).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });

  const senderLabel = align === "right" ? "You" : "They";
  const statusLabel = seen ? "Seen" : readAt ? "Read" : "";

  if (skeleton) {
    return (
      <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <span className={`${baseClasses} ${alignClass} h-14 animate-pulse`} />
      </div>
    );
  }

  return (
    <div
      className={`flex ${align === "right" ? "justify-end" : "justify-start"} flex-col gap-2`}
      role="group"
      aria-label={`${senderLabel} said ${text ?? ""}`}
    >
      <span className={`${baseClasses} ${alignClass}`}>{text}</span>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        {formattedTimestamp && (
          <time
            dateTime={timestamp}
            aria-label={`${senderLabel} sent this at ${formattedTimestamp}`}
          >
            {formattedTimestamp}
          </time>
        )}
        {statusLabel && <span aria-label={statusLabel}>{statusLabel}</span>}
      </div>
    </div>
  );
}