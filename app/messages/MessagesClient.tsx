"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import ChatList from "@/components/ChatList";
import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import type { Message, MessageThread } from "@/lib/types";

import { sendMessageAction } from "./actions";

const ChatThread = dynamic(() => import("@/components/ChatThread"), {
  ssr: false,
  loading: () => <div className="flex h-[320px] items-center justify-center text-sm text-text-muted">Loading conversation…</div>
});

const MessageInput = dynamic(() => import("@/components/MessageInput"), {
  ssr: false,
  loading: () => null
});

type MessagesClientProps = {
  threads: MessageThread[];
  initialMessages: Message[];
  activeThreadId?: string;
};

export default function MessagesClient({
  threads,
  initialMessages,
  activeThreadId
}: MessagesClientProps) {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(activeThreadId);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setCurrentThreadId(activeThreadId);
  }, [activeThreadId]);

  if (!threads.length) {
    return (
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
  }

  const handleSend = async (text: string) => {
    if (!currentThreadId) return;
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      threadId: currentThreadId,
      senderId: "user_current",
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
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <ChatList
        threads={threads}
        activeThreadId={currentThreadId}
      />
      <div className="space-y-4">
        <ChatThread messages={messages} />
        <MessageInput threadId={currentThreadId} onSend={handleSend} disabled={!currentThreadId} />
      </div>
    </div>
  );
}

