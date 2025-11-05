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
    const next = new URLSearchParams(params?.toString() ?? "");
    next.set("t", threadId);
    const path = pathname ?? "/";
    router.push(`${path}?${next.toString()}` as Route, { scroll: false });
  };

  return (
    <aside className="flex h-full min-w-[260px] flex-col gap-5 rounded-3xl border border-black/5 bg-white p-4 shadow-soft lg:gap-6 lg:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-brand-dark">Messages</h2>
        <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-teal">
          {threads.length} threads
        </span>
      </div>
      <label className="relative block">
        <span className="sr-only">Search conversations</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          className="input h-11 pl-10"
          data-testid="messages-search"
        />
        <ChatBubbleLeftRightIcon
          className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-brand-blue"
          aria-hidden="true"
        />
      </label>
      <div className="flex-1 overflow-y-auto">
        <ul className="grid gap-3" role="list">
          {filteredThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            const hasUnread = thread.unreadCount > 0;
            const formattedTime = new Date(thread.updatedAt).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit"
            });
            const ariaLabel = hasUnread
              ? `${thread.otherPartyName}, ${thread.unreadCount} unread messages`
              : thread.otherPartyName;
            return (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(thread.id)}
                  className={`group relative flex w-full items-stretch gap-3 rounded-2xl border px-4 py-3 text-left transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal ${
                    isActive
                      ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                      : "border-transparent bg-surface hover:border-brand-teal/20 hover:bg-brand-teal/5"
                  }`}
                  aria-pressed={isActive}
                  aria-label={ariaLabel}
                  data-testid={`thread-${thread.id}`}
                  data-has-unread={hasUnread}
                >
                  <div className="flex flex-1 items-start gap-3">
                    <span
                      className={`mt-1.5 inline-flex h-2 w-2 rounded-full transition ${
                        hasUnread ? "bg-brand-green" : "bg-transparent ring-1 ring-black/10"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span
                          className={`text-sm font-semibold sm:text-base ${
                            isActive ? "text-brand-teal" : "text-brand-dark"
                          }`}
                        >
                          {thread.otherPartyName}
                        </span>
                        <time
                          dateTime={thread.updatedAt}
                          className="text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:text-xs"
                        >
                          {formattedTime}
                        </time>
                      </div>
                      <p className="line-clamp-2 text-xs text-text-muted sm:text-sm">
                        {thread.lastMessage ?? "No messages yet"}
                      </p>
                    </div>
                  </div>
                  {hasUnread && (
                    <span className="inline-flex min-w-[26px] justify-center rounded-full bg-brand-green px-2 py-0.5 text-[11px] font-semibold text-white">
                      {thread.unreadCount}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
