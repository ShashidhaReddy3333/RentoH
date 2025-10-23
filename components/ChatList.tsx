"use client";

import { useMemo, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

import type { MessageThread } from "@/lib/types";

type ChatListProps = {
  threads: MessageThread[];
  activeThreadId?: string;
};

export default function ChatList({ threads, activeThreadId }: ChatListProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filteredThreads = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.trim().toLowerCase();
    return threads.filter((thread) => thread.otherPartyName.toLowerCase().includes(q));
  }, [threads, query]);

  const handleSelect = (threadId: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("t", threadId);
    router.push(`${pathname}?${next.toString()}` as Route, { scroll: false });
  };

  return (
    <aside className="flex h-full flex-col gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-brand-dark">Messages</h2>
        <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal">
          {threads.length} threads
        </span>
      </div>
      <label className="relative">
        <span className="sr-only">Search conversations</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          className="input pl-10"
          data-testid="messages-search"
        />
        <ChatBubbleLeftRightIcon
          className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-brand-blue"
          aria-hidden="true"
        />
      </label>
      <div className="flex-1 overflow-y-auto">
        <ul className="grid gap-2" role="list">
          {filteredThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(thread.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal ${
                    isActive
                      ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                      : "border-transparent bg-surface hover:border-brand-teal/20 hover:bg-brand-teal/5"
                  }`}
                  aria-pressed={isActive}
                  data-testid={`thread-${thread.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <span className="text-sm font-semibold text-brand-dark">{thread.otherPartyName}</span>
                      <span className="line-clamp-1 text-xs text-text-muted">
                        {thread.lastMessage ?? "No messages yet"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[11px] font-semibold uppercase text-brand-blue">
                        {new Date(thread.updatedAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </span>
                      {thread.unreadCount > 0 && (
                        <span className="inline-flex min-w-[24px] justify-center rounded-full bg-brand-blue px-2 py-0.5 text-[11px] font-semibold text-white">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
