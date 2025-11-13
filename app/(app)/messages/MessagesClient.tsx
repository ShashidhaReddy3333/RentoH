"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatDistanceToNowStrict } from "date-fns";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

import ChatThread from "@/components/ChatThread";
import ConversationItem from "@/components/messages/ConversationItem";
import Composer from "@/components/messages/Composer";
import ChatHeader from "@/components/messages/ChatHeader";
import EmptyState from "@/components/EmptyState";
import Chip from "@/components/messages/Chip";
import { buttonStyles } from "@/components/ui/button";
import type { Message, MessageThread } from "@/lib/types";

import { sendMessageAction, markThreadAsReadAction } from "./actions";
import { useMessageSubscription } from "@/lib/realtime/message-subscription";

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
  const [threadLoading, setThreadLoading] = useState(false);
  const conversationHeadingId = "messages-conversations-heading";
  const searchInputId = "messages-conversations-search";

  useEffect(() => {
    setMessages(initialMessages);
    setThreadLoading(false);
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

  // Mark the active thread as read when it changes
  useEffect(() => {
    if (activeThreadId) {
      markThreadAsReadAction(activeThreadId).catch((error) => {
        console.error("[messages] Failed to mark initial thread as read", error);
      });
    }
  }, [activeThreadId]);

  // Subscribe to realtime message updates
  useMessageSubscription(currentThreadId, {
    onInsert: useCallback((message: Message) => {
      // Only add if not already in the list (avoid duplicates from optimistic updates)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    }, []),
    onUpdate: useCallback((message: Message) => {
      setMessages((prev) => 
        prev.map((m) => (m.id === message.id ? message : m))
      );
    }, [])
  });

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
    async (threadId: string) => {
      if (threadId === currentThreadId && !threadLoading) {
        return;
      }
      setThreadLoading(true);
      setStatusText(undefined);
      setCurrentThreadId(threadId);
      const next = new URLSearchParams(params?.toString() ?? "");
      next.set("t", threadId);
      router.push(`${pathname}?${next.toString()}` as Route, { scroll: false });

      // Mark the thread as read when it's opened
      try {
        await markThreadAsReadAction(threadId);
      } catch (error) {
        console.error("[messages] Failed to mark thread as read", error);
      }
    },
    [currentThreadId, params, pathname, router, threadLoading]
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
        
        // Refresh the thread list to update last message
        router.refresh();
      } catch (error) {
        console.error("[messages] Failed to send message:", error);
        setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
        
        // Show user-friendly error
        setStatusText("Failed to send message. Please try again.");
        setTimeout(() => setStatusText(""), 3000);
      }
    },
    [currentThreadId, currentUserId, router]
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

  const headerStatusText = threadLoading ? "Loading conversation..." : statusText;

  if (threads.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className="flex h-full w-full justify-center bg-brand-light/40">
      <div className="flex h-full w-full max-w-5xl">
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
              statusText={headerStatusText}
            />
            <ChatThread
              messages={messages}
              currentUserId={currentUserId}
              threadId={activeThread.id}
              onStatusChange={setStatusText}
              loading={threadLoading}
            />
            <Composer onSend={handleSend} disabled={!currentThreadId || threadLoading} />
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
      </div>
    </div>
  );
}
