"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useAppState } from "@/components/providers/app-provider";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationsPanel() {
  const { messages, properties, users } = useAppState();

  const items = useMemo(() => {
    return [...messages]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((message) => {
        const property = properties.find((item) => item.id === message.propertyId);
        const sender = users.find((user) => user.id === message.senderId);
        return {
          id: message.id,
          body: message.body,
          createdAt: new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }),
          propertyTitle: property?.title ?? "Unknown property",
          propertyId: property?.id ?? "",
          sender: sender?.name ?? "User"
        };
      });
  }, [messages, properties, users]);

  return (
    <Card className="w-full max-w-sm space-y-4">
      <CardContent className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-textc">Notifications</h2>
          <p className="text-xs text-textc/60">
            Latest inquiries and updates across your listings.
          </p>
        </header>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-black/10 p-3 text-sm text-textc dark:border-white/10">
              <div className="flex justify-between text-xs text-textc/50">
                <span>{item.createdAt}</span>
                <span>{item.sender}</span>
              </div>
              <p className="mt-1 text-textc/80">{item.body}</p>
              {item.propertyId ? (
                <Link
                  href={`/messages?property=${item.propertyId}`}
                  className="mt-2 inline-block text-xs font-medium text-brand.blue hover:text-brand.primary"
                >
                  Open chat - {item.propertyTitle}
                </Link>
              ) : null}
            </li>
          ))}
          {!items.length ? (
            <li className="rounded-xl border border-dashed border-black/10 px-3 py-6 text-center text-sm text-textc/60 dark:border-white/10">
              All caught up! You have no new notifications.
            </li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}
