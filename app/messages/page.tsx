"use client";

import { useEffect, useMemo, useState } from "react";
import ChatPane, { Conversation } from "@/components/chat-pane";
import { useAppState } from "@/components/providers/app-provider";

const CURRENT_USER_ID = "u1";

export default function MessagesPage() {
  const { properties, messages, users, sendMessage } = useAppState();

  const conversations = useMemo(() => {
    const grouped = new Map<string, Conversation>();
    messages.forEach((message) => {
      const property = properties.find((item) => item.id === message.propertyId);
      if (!property) return;
      const landlord = users.find((user) => user.id === property.landlordId);
      const normalized: Conversation = grouped.get(property.id) ?? {
        id: property.id,
        title: property.title,
        otherUserId: property.landlordId,
        otherUserName: landlord?.name ?? "Landlord",
        messages: []
      };
      normalized.messages = [
        ...normalized.messages,
        {
          id: message.id,
          body: message.body,
          senderId: message.senderId,
          createdAt: message.createdAt
        }
      ];
      grouped.set(property.id, normalized);
    });
    return Array.from(grouped.values());
  }, [messages, properties, users]);

  const [activeId, setActiveId] = useState<string | undefined>(conversations[0]?.id);

  useEffect(() => {
    if (!activeId && conversations[0]) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];

  const handleSend = (body: string) => {
    if (!activeConversation) return;
    sendMessage({
      body,
      propertyId: activeConversation.id,
      senderId: CURRENT_USER_ID,
      recipientId: activeConversation.otherUserId
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <aside className="card h-full md:h-[70vh]">
        <h1 className="text-xl font-semibold text-[var(--c-dark)]">Messages</h1>
        <p className="text-xs text-gray-500">Stay on top of tenant and landlord conversations.</p>
        <nav className="mt-4 space-y-2 overflow-y-auto">
          {conversations.map((conversation) => {
            const last = conversation.messages.at(-1);
            const property = properties.find((item) => item.id === conversation.id);
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveId(conversation.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  activeId === conversation.id
                    ? "border-[var(--c-primary)] bg-[var(--c-primary)]/10 text-[var(--c-primary)]"
                    : "border-transparent bg-gray-50 text-gray-700 hover:border-gray-200"
                }`}
              >
                <div className="text-sm font-semibold">{conversation.title}</div>
                <div className="text-xs text-gray-500">
                  {property?.city ?? "Unknown city"} - {last?.body.slice(0, 40) ?? "Start chatting"}
                </div>
              </button>
            );
          })}
          {!conversations.length && (
            <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-500">
              No messages yet. Start a conversation from a property page.
            </div>
          )}
        </nav>
      </aside>
      <section className="h-full md:h-[70vh]">
        {activeConversation ? (
          <ChatPane
            conversation={activeConversation}
            currentUserId={CURRENT_USER_ID}
            onSend={(message) => handleSend(message.body)}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-gray-500">
            Select a conversation to view messages.
          </div>
        )}
      </section>
    </div>
  );
}
