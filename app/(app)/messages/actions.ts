"use server";

import { sendMessage, markThreadAsRead } from "@/lib/data-access/messages";

export async function sendMessageAction(threadId: string, text: string) {
  return sendMessage(threadId, text);
}

export async function markThreadAsReadAction(threadId: string) {
  return markThreadAsRead(threadId);
}
