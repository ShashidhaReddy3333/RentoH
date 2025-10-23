"use client";

import { useEffect, useRef } from "react";

import type { Message } from "@/lib/types";

const CURRENT_USER_ID = "user_current";

type ChatThreadProps = {
  messages: Message[];
  loading?: boolean;
};

export default function ChatThread({ messages, loading = false }: ChatThreadProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <section className="flex h-full flex-col rounded-3xl border border-black/5 bg-white shadow-soft">
      <header className="flex items-center justify-between border-b border-black/5 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-brand-dark">Conversation</h2>
          <p className="text-xs text-text-muted">Messages are synced when Supabase is connected.</p>
        </div>
      </header>
      <div ref={viewportRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
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
              align={message.senderId === CURRENT_USER_ID ? "right" : "left"}
              text={message.text}
              timestamp={new Date(message.createdAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit"
              })}
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

  if (skeleton) {
    return (
      <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <span className={`${baseClasses} ${alignClass} h-14 animate-pulse`} />
      </div>
    );
  }

  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"} flex-col gap-2`}>
      <span className={`${baseClasses} ${alignClass}`}>{text}</span>
      <time
        className="text-xs text-text-muted"
        dateTime={timestamp}
        aria-label={`Sent at ${timestamp}`}
      >
        {timestamp}
      </time>
    </div>
  );
}
