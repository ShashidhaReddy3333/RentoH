"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-surface shadow-glass dark:border-white/10">
      <header className="border-b border-black/10 px-4 py-3 text-textc/70 dark:border-white/10">
        <div className="text-sm">Chatting about</div>
        <h2 className="text-lg font-semibold text-textc">{conversation.title}</h2>
        <p className="text-xs">With {conversation.otherUserName}</p>
      </header>
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-3 overflow-y-auto bg-surface-muted px-4 py-5"
      >
        {sortedMessages.map((message) => {
          const isMe = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-soft ${
                isMe
                  ? "ml-auto bg-brand.primary text-white"
                  : "bg-surface text-textc"
              }`}
            >
              <p>{message.body}</p>
              <time className={`block pt-1 text-xs ${isMe ? "text-white/80" : "text-textc/60"}`}>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </time>
            </div>
          );
        })}
        {isTyping && (
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs text-textc/70 shadow-soft">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-textc/60" />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-textc/60"
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-textc/60"
                style={{ animationDelay: "0.2s" }}
              />
            </span>
            {conversation.otherUserName} is typing...
          </div>
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-black/10 bg-surface px-4 py-3 dark:border-white/10">
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
