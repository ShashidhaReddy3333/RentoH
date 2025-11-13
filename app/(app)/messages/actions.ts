"use server";

import { cookies } from "next/headers";
import { markThreadAsRead } from "@/lib/data-access/messages";
import type { Message } from "@/lib/types";

const CSRF_COOKIE = "rento_csrf";

export async function sendMessageAction(threadId: string, text: string): Promise<Message> {
  // Get CSRF token from cookies
  const cookieStore = cookies();
  const csrfToken = cookieStore.get(CSRF_COOKIE)?.value;

  // Call the API route instead of directly accessing Supabase
  const origin = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000';
  const response = await fetch(`${origin}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieStore.toString()
    },
    body: JSON.stringify({
      threadId,
      body: text,
      csrf: csrfToken
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(errorData.error || 'Failed to send message');
  }

  const data = await response.json();
  return data.message;
}

export async function markThreadAsReadAction(threadId: string) {
  return markThreadAsRead(threadId);
}
