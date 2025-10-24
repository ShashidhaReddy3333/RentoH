﻿import type { Metadata } from "next";

import MessagesClient from "@/app/(app)/messages/MessagesClient";
import { getCurrentUser } from "@/lib/data-access/profile";
import { getThreadMessages, listThreads } from "@/lib/data-access/messages";

export const metadata: Metadata = {
  title: "Messages - Rento",
  description: "Stay in touch with landlords and renters using secure Rento messaging."
};

export default async function MessagesPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [threads, currentUser] = await Promise.all([listThreads(), getCurrentUser()]);
  const activeThreadId = resolveThreadId(searchParams["t"], threads);
  const messages = activeThreadId ? await getThreadMessages(activeThreadId) : [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Messages</h1>
        <p className="text-sm text-text-muted">
          Review recent conversations, respond to renters, and keep communication organized.
        </p>
      </header>
      <MessagesClient
        threads={threads}
        initialMessages={messages}
        activeThreadId={activeThreadId}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}

function resolveThreadId(
  param: string | string[] | undefined,
  threads: Awaited<ReturnType<typeof listThreads>>
) {
  const fromParam = Array.isArray(param) ? param[0] : param;
  if (fromParam && threads.some((thread) => thread.id === fromParam)) {
    return fromParam;
  }
  return threads[0]?.id;
}
