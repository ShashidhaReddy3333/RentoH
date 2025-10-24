"use client";

import { useEffect, useRef } from "react";

import type { Message } from "@/lib/types";

type ChatThreadProps = {
  messages: Message[];
  loading?: boolean;
  currentUserId?: string;
};

export default function ChatThread({ messages, loading = false, currentUserId }: ChatThreadProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages.length]);

  return (
    <section className="flex h-full flex-col rounded-3xl border border-black/5 bg-white shadow-soft">
      <header className="flex items-center justify-between border-b border-black/5 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-brand-dark">Conversation</h2>
          <p className="text-xs text-text-muted">Messages are synced when Supabase is connected.</p>
        </div>
      </header>
      <div
        ref={viewportRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation messages"
        tabIndex={0}
        className="flex-1 space-y-4 overflow-y-auto px-6 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
      >
        {loading ? (
          <div className="flex flex-col gap-3">
            <Bubble skeleton align="left" />
            <Bubble skeleton align="right" />
            <Bubble skeleton align="left" />
          </div>
        ) : (
          messages.map((message) => (
            <Bubble
              key={message.id}
              align={message.senderId === currentUserId ? "right" : "left"}
              text={message.text}
              timestamp={message.createdAt}
            />
          ))
        )}
      </div>
    </section>
  );
}

function Bubble({
  align,
  text,
  timestamp,
  skeleton = false
}: {
  align: "left" | "right";
  text?: string;
  timestamp?: string;
  skeleton?: boolean;
}) {
  const baseClasses =
    "max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-soft sm:max-w-[65%]";

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
      {formattedTimestamp ? (
        <time
          className="text-xs text-text-muted"
          dateTime={timestamp}
          aria-label={`${senderLabel} sent this at ${formattedTimestamp}`}
        >
          {formattedTimestamp}
        </time>
      ) : null}
    </div>
  );
}