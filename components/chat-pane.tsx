"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    <div className="flex flex-col h-full bg-white rounded-xl shadow-card overflow-hidden">
      <header className="border-b px-4 py-3">
        <div className="text-sm text-gray-500">Chatting about</div>
        <h2 className="text-lg font-semibold text-[var(--c-dark)]">{conversation.title}</h2>
        <p className="text-xs text-gray-500">With {conversation.otherUserName}</p>
      </header>
      <div ref={listRef} className="flex-1 overflow-y-auto bg-[var(--c-bg)] px-4 py-5 space-y-3">
        {sortedMessages.map((message) => {
          const isMe = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-soft ${
                isMe
                  ? "ml-auto bg-[var(--c-primary)] text-white"
                  : "bg-white text-[var(--c-dark)]"
              }`}
            >
              <p>{message.body}</p>
              <time className="block text-xs text-white/80 pt-1">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </time>
            </div>
          );
        })}
        {isTyping && (
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs text-gray-600 shadow-soft">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.1s" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.2s" }} />
            </span>
            {conversation.otherUserName} is typing...
          </div>
        )}
      </div>
      <form onSubmit={handleSend} className="border-t bg-white px-4 py-3 flex gap-2">
        <input
          className="input"
          placeholder="Write a message..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="Message"
        />
        <button type="submit" className="btn btn-primary min-w-[88px]">
          Send
        </button>
      </form>
    </div>
  );
}
