"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/button";

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  otherUserId: string;
  otherUserName: string;
  messages: ChatMessage[];
};

type ChatPaneProps = {
  conversation: Conversation;
  currentUserId: string;
  onSend?: (message: ChatMessage) => void;
};

export default function ChatPane({ conversation, currentUserId, onSend }: ChatPaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(conversation.messages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const otherInitials = getInitials(conversation.otherUserName);

  useEffect(() => {
    setMessages(conversation.messages);
  }, [conversation]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;

    const nextMessage: ChatMessage = {
      id: `${conversation.id}-${Date.now()}`,
      body: input.trim(),
      senderId: currentUserId,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, nextMessage]);
    onSend?.(nextMessage);
    setInput("");
    simulateReply();
  }

  function simulateReply() {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${conversation.id}-reply-${Date.now()}`,
          body: "Thanks for reaching out! I'll get back to you soon.",
          senderId: conversation.otherUserId,
          createdAt: new Date().toISOString()
        }
      ]);
      setIsTyping(false);
    }, 900);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-dark/10 bg-surface shadow-soft transition-colors dark:border-white/10">
      <header className="border-b border-brand-dark/10 bg-surface px-5 py-4 text-text-muted dark:border-white/10">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Chatting about
        </div>
        <h2 className="text-lg font-semibold text-textc">{conversation.title}</h2>
        <p className="text-xs text-text-muted">With {conversation.otherUserName}</p>
      </header>
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-4 overflow-y-auto bg-surface-muted px-5 py-6"
      >
        {sortedMessages.map((message) => {
          const isMe = message.senderId === currentUserId;
          const timestamp = formatTimestamp(message.createdAt);

          return (
            <div
              key={message.id}
              className={clsx("flex gap-3", isMe ? "flex-row-reverse text-right" : "flex-row")}
            >
              <div
                className={clsx(
                  "mt-1 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold uppercase",
                  isMe ? "bg-brand-teal text-white" : "bg-brand-teal/10 text-brand-teal"
                )}
                aria-hidden
              >
                {isMe ? "You" : otherInitials}
              </div>
              <div className="max-w-[70%] space-y-1">
                <div
                  className={clsx(
                    "rounded-2xl px-4 py-3 text-sm shadow-soft transition-colors",
                    isMe ? "bg-brand-teal text-white" : "bg-surface text-textc dark:bg-surface"
                  )}
                >
                  <p className="whitespace-pre-line break-words">{message.body}</p>
                </div>
                <time
                  className={clsx("block text-xs", isMe ? "text-white/80" : "text-text-muted")}
                >
                  {timestamp}
                </time>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs text-text-muted shadow-soft">
            <span className="flex items-center gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted/80" />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted/80"
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted/80"
                style={{ animationDelay: "0.2s" }}
              />
            </span>
            {conversation.otherUserName} is typing...
          </div>
        )}
      </div>
      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-brand-dark/10 bg-surface px-5 py-4 dark:border-white/10"
      >
        <input
          className="input"
          placeholder="Write a message..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="Message"
        />
        <Button type="submit" className="min-w-[88px]">
          Send
        </Button>
      </form>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
  return initials.join("") || "RB";
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
