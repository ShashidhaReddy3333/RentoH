"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatDistanceToNowStrict } from "date-fns";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

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
  const conversationHeadingId = "messages-conversations-heading";
  const searchInputId = "messages-conversations-search";

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
      icon={
        <ChatBubbleLeftRightIcon className="h-12 w-12 text-brand-primary" aria-hidden="true" />
      }
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

  const propertyApplicationRoute = activeThread?.propertyId
    ? (`/property/${activeThread.propertyId}/apply` as Route)
    : undefined;

  const handleStartApplication = useCallback(() => {
    if (!propertyApplicationRoute) return;
    router.push(propertyApplicationRoute);
  }, [propertyApplicationRoute, router]);

  const dealPanelApplicant = activeThread
    ? {
        name: activeThread.otherPartyName,
        initials: computeInitials(activeThread.otherPartyName),
        memberSince: formatDistanceToNowStrict(new Date(activeThread.updatedAt), { addSuffix: true }),
        actions: propertyApplicationRoute
          ? [
              {
                label: "Start application",
                variant: "primary" as const,
                onClick: handleStartApplication
              }
            ]
          : undefined
      }
    : undefined;

  return (
    <div className="flex h-full w-full bg-brand-light/40">
      <aside
        className="hidden h-full w-[360px] shrink-0 overflow-y-auto border-r border-brand-outline/60 bg-white/90 p-4 backdrop-blur md:block"
        aria-labelledby={conversationHeadingId}
        aria-label="Conversations"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id={conversationHeadingId} className="text-base font-semibold text-brand-dark">
              Conversations
            </h2>
            <p className="text-xs text-neutral-500">Stay in sync with renters and landlords.</p>
          </div>
          <Chip>{`${threads.length} total`}</Chip>
        </div>
        <label className="mt-4 block" htmlFor={searchInputId}>
          <span className="sr-only">Search conversations</span>
          <input
            id={searchInputId}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or message"
            className="w-full rounded-full border border-brand-outline/60 bg-white px-3 py-2 text-sm text-brand-dark shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          />
        </label>
        <ul className="mt-4 space-y-2" role="list">
          {filteredThreads.length === 0 ? (
            <li>
              <p
                className="rounded-2xl border border-brand-outline/50 bg-brand-light p-4 text-sm text-neutral-500"
                role="status"
              >
                No conversations found. Try a different search.
              </p>
            </li>
          ) : (
            filteredThreads.map((thread) => (
              <li key={thread.id} className="list-none">
                <ConversationItem
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
              </li>
            ))
          )}
        </ul>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-brand-outline/60 bg-white px-4 py-3 md:hidden">
          <label className="block text-xs font-medium text-neutral-500">
            Conversation
            <select
              className="mt-1 w-full rounded-lg border border-brand-outline/60 bg-white px-3 py-2 text-sm text-brand-dark shadow-sm focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 bg-white text-center text-sm text-neutral-500"
            role="status"
            aria-live="polite"
          >
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
