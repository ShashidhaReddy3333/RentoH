
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppState } from "@/components/providers/app-provider";

export default function NotificationsPanel() {
  const { messages, properties, users } = useAppState();

  const items = useMemo(() => {
    return [...messages]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
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
    <aside className="card w-full max-w-sm space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-[var(--c-dark)]">Notifications</h2>
        <p className="text-xs text-gray-500">Latest inquiries and updates across your listings.</p>
      </header>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-gray-100 px-3 py-2 text-sm">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{item.createdAt}</span>
              <span>{item.sender}</span>
            </div>
            <p className="mt-1 text-gray-700">{item.body}</p>
            {item.propertyId && (
              <Link
                href={`/messages?property=${item.propertyId}`}
                className="mt-2 inline-block text-xs font-medium text-[var(--c-blue)] hover:underline"
              >
                Open chat - {item.propertyTitle}
              </Link>
            )}
          </li>
        ))}
        {!items.length && (
          <li className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
            All caught up! You have no new notifications.
          </li>
        )}
      </ul>
    </aside>
  );
}
