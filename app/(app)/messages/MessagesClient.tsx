"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";

import ChatThread from "@/components/ChatThread";
import ConversationItem from "@/components/messages/ConversationItem";
import Composer from "@/components/messages/Composer";
import DealPanel from "@/components/messages/DealPanel";
import ChatHeader from "@/components/messages/ChatHeader";
import EmptyState from "@/components/EmptyState";
import Chip from "@/components/messages/Chip";
import { buttonStyles } from "@/components/ui/button";
import type { Message, MessageThread } from "@/lib/types";

import { sendMessageAction } from "./actions";

type MessagesClientProps = {
  threads: MessageThread[];
  initialMessages: Message[];
  activeThreadId?: string;
  currentUserId?: string;
};

function computeInitials(name: string | undefined) {
  if (!name) return "??";
  const parts = name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2);
  return parts.length ? parts.join("").toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function MessagesClient({
  threads,
  initialMessages,
  activeThreadId,
  currentUserId
}: MessagesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(activeThreadId);
  const [search, setSearch] = useState("");
  const [statusText, setStatusText] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setCurrentThreadId(activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    if (!currentThreadId && threads.length > 0) {
      const firstThread = threads[0];
      if (firstThread) {
        setCurrentThreadId(firstThread.id);
      }
    }
  }, [currentThreadId, threads]);

  const filteredThreads = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.trim().toLowerCase();
    return threads.filter(
      (thread) =>
        thread.otherPartyName.toLowerCase().includes(q) ||
        (thread.lastMessage ?? "").toLowerCase().includes(q) ||
        (thread.subject ?? "").toLowerCase().includes(q)
    );
  }, [threads, search]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === currentThreadId),
    [threads, currentThreadId]
  );

  const handleSelectThread = useCallback(
    (threadId: string) => {
      setCurrentThreadId(threadId);
      const next = new URLSearchParams(params?.toString() ?? "");
      next.set("t", threadId);
      router.push(`${pathname}?${next.toString()}` as Route, { scroll: false });
    },
    [params, pathname, router]
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!currentThreadId) return;
      const optimistic: Message = {
        id: `temp-${Date.now()}`,
        threadId: currentThreadId,
        senderId: currentUserId ?? "self",
        text,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, optimistic]);

      try {
        const saved = await sendMessageAction(currentThreadId, text);
        setMessages((prev) =>
          prev.map((message) => (message.id === optimistic.id ? saved : message))
        );
      } catch (error) {
        console.error(error);
        setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
      }
    },
    [currentThreadId, currentUserId]
  );

  const renderEmptyState = () => (
    <EmptyState
      title="You have no conversations yet"
      description="Browse homes and reach out to landlords to start a conversation."
      action={
        <button
          type="button"
          onClick={() => router.push("/browse")}
          className={buttonStyles({ variant: "primary", size: "md" })}
          data-testid="messages-empty-browse"
        >
          Browse homes
        </button>
      }
    />
  );

  if (threads.length === 0) {
    return renderEmptyState();
  }

  const listingTags = activeThread
    ? [activeThread.subject, activeThread.propertyTitle].filter(
        (value): value is string => Boolean(value && value.trim())
      )
    : [];

  const dealPanelListing = activeThread
    ? {
        title: activeThread.propertyTitle ?? "Listing",
        price: undefined,
        availableFrom: undefined,
        tags: listingTags,
        imageUrl: undefined,
        linkUrl: activeThread.propertyId ? `/property/${activeThread.propertyId}` : undefined
      }
    : undefined;

  const dealPanelApplicant = activeThread
    ? {
        name: activeThread.otherPartyName,
        initials: computeInitials(activeThread.otherPartyName),
        memberSince: formatDistanceToNowStrict(new Date(activeThread.updatedAt), { addSuffix: true })
      }
    : undefined;

  return (
    <div className="flex h-full w-full">
      <aside className="hidden h-full w-[320px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 md:block">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
          <Chip>{`${threads.length} total`}</Chip>
        </div>
        <label className="mt-3 block">
          <span className="sr-only">Search conversations</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <div className="mt-3 space-y-2">
          {filteredThreads.map((thread) => (
            <ConversationItem
              key={thread.id}
              name={thread.otherPartyName}
              lastMessage={thread.lastMessage ?? "No messages yet"}
              tags={
                [thread.subject, thread.propertyTitle].filter(
                  (value): value is string => Boolean(value && value.trim())
                )
              }
              updatedText={formatDistanceToNowStrict(new Date(thread.updatedAt), { addSuffix: true })}
              unreadCount={thread.unreadCount}
              active={thread.id === currentThreadId}
              onClick={() => handleSelectThread(thread.id)}
            />
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-200 bg-white px-4 py-2 md:hidden">
          <label className="block text-xs font-medium text-slate-500">
            Conversation
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={currentThreadId}
              onChange={(event) => handleSelectThread(event.target.value)}
            >
              {threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.otherPartyName}
                </option>
              ))}
            </select>
          </label>
        </div>
        {activeThread ? (
          <>
            <ChatHeader
              name={activeThread.otherPartyName}
              listingTitle={activeThread.propertyTitle}
              listingUrl={activeThread.propertyId ? `/property/${activeThread.propertyId}` : undefined}
              initials={computeInitials(activeThread.otherPartyName)}
              statusText={statusText}
            />
            <ChatThread
              messages={messages}
              currentUserId={currentUserId}
              threadId={activeThread.id}
              onStatusChange={setStatusText}
            />
            <Composer onSend={handleSend} disabled={!currentThreadId} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white text-center text-sm text-slate-500">
            <p>Select a conversation to get started.</p>
          </div>
        )}
      </main>

      <DealPanel
        listing={dealPanelListing}
        applicant={dealPanelApplicant}
        labels={listingTags}
        notes={activeThread?.lastMessage}
      />
    </div>
  );
}
