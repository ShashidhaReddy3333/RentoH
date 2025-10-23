import type { Metadata } from "next";

import MessagesClient from "@/app/messages/MessagesClient";
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
  const threads = await listThreads();
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
