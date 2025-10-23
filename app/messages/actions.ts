"use server";

import { sendMessage } from "@/lib/data-access/messages";

export async function sendMessageAction(threadId: string, text: string) {
  return sendMessage(threadId, text);
}
