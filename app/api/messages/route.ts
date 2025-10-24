import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MessagePayload = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(2000)
});

const CSRF_COOKIE = "rento_csrf";
const CSRF_HEADER = "x-csrf-token";

export async function POST(request: Request) {
  if (!hasSupabaseEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const csrfCookie = cookies().get(CSRF_COOKIE)?.value;
  const csrfHeader = request.headers.get(CSRF_HEADER);

  if (!csrfCookie || !csrfHeader || !timingSafeEquals(csrfCookie, csrfHeader)) {
    return NextResponse.json({ error: "Invalid CSRF token." }, { status: 403 });
  }

  const payload = await parseBody(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client unavailable." }, { status: 503 });
  }

  const {
    data: { user },
    error: sessionError
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const threadCheck = await supabase
    .from("message_threads")
    .select("id")
    .eq("id", payload.threadId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (threadCheck.error || !threadCheck.data) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const { error: insertError } = await supabase.from("messages").insert({
    thread_id: payload.threadId,
    sender_id: user.id,
    body: payload.body
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  await supabase
    .from("message_threads")
    .update({
      last_message: payload.body,
      unread_count: 0,
      updated_at: new Date().toISOString()
    })
    .eq("id", payload.threadId)
    .eq("owner_id", user.id);

  return new Response(null, { status: 204 });
}

async function parseBody(request: Request) {
  try {
    const json = await request.json();
    const result = MessagePayload.safeParse(json);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function timingSafeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}



