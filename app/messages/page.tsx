"use client";

import { useEffect, useMemo, useState } from "react";

import ChatPane from "@/components/chat-pane";
import type { Conversation } from "@/components/chat-pane";
import { useAppState } from "@/components/providers/app-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="grid gap-4 text-textc md:grid-cols-[300px_1fr]">
      <Card className="h-full md:h-[70vh]">
        <CardContent className="flex h-full flex-col gap-4">
          <header>
            <h1 className="text-xl font-semibold text-textc">Messages</h1>
            <p className="text-xs text-textc/60">
              Stay on top of tenant and landlord conversations.
            </p>
          </header>
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
            {conversations.map((conversation) => {
              const last = conversation.messages.at(-1);
              const property = properties.find((item) => item.id === conversation.id);
              const isActive = activeId === conversation.id;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={`${buttonStyles({ variant: isActive ? "outline" : "ghost", size: "sm" })} w-full justify-start text-left`}
                >
                  <div className="text-sm font-semibold text-textc">{conversation.title}</div>
                  <div className="text-xs text-textc/60">
                    {property?.city ?? "Unknown city"} -
                    {" "}
                    {last?.body.slice(0, 40) ?? "Start chatting"}
                  </div>
                </button>
              );
            })}
            {!conversations.length ? (
              <div className="rounded-lg border border-dashed border-black/10 px-3 py-4 text-center text-sm text-textc/60 dark:border-white/10">
                No messages yet. Start a conversation from a property page.
              </div>
            ) : null}
          </nav>
        </CardContent>
      </Card>
      <section className="h-full md:h-[70vh]">
        {activeConversation ? (
          <ChatPane
            conversation={activeConversation}
            currentUserId={CURRENT_USER_ID}
            onSend={(message) => handleSend(message.body)}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-black/10 bg-surface text-textc/70 dark:border-white/10">
            Select a conversation to view messages.
          </div>
        )}
      </section>
    </div>
  );
}
