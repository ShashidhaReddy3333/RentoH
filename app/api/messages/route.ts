import { NextResponse, type NextRequest } from "next/server";

import { validateAuthRequest, handleAuthError } from "@/lib/http/auth";
import { HttpError } from "@/lib/http/errors";
import { MessagePayload, MessageQueryParams } from "@/lib/validators/messages";
import { generateDigestForUser } from "@/lib/notifications/digest";

// Message rate limiting settings
const MIN_INTERVAL_BETWEEN_MESSAGES = 500; // ms
const lastMessageTime = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
  const { body, supabase } = await validateAuthRequest(request);
    
    // Get authenticated user
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) {
      throw new HttpError(401, "Authentication required", "AUTH_REQUIRED");
    }

    // Validate request body
    const payload = MessagePayload.parse(body);

    // Check message rate limiting
    const now = Date.now();
    const lastTime = lastMessageTime.get(user.id) || 0;
    if (now - lastTime < MIN_INTERVAL_BETWEEN_MESSAGES) {
      throw new HttpError(429, "Please wait before sending another message", "RATE_LIMIT");
    }
    lastMessageTime.set(user.id, now);

    // Verify thread exists and user is a participant
    const { data: thread, error: threadError } = await supabase!
      .from("message_threads")
      .select("participant_ids, owner_id")
      .eq("id", payload.threadId)
      .single();

    if (threadError || !thread) {
      throw new HttpError(404, "Thread not found", "THREAD_NOT_FOUND");
    }

    // Check if user is thread owner or participant
    if (thread.owner_id !== user.id && !thread.participant_ids?.includes(user.id)) {
      throw new HttpError(403, "Not authorized to send messages in this thread", "NOT_PARTICIPANT");
    }

    // Insert message
    const { error: insertError } = await supabase!.from("messages").insert({
      thread_id: payload.threadId,
      sender_id: user.id,
      body: payload.body
    });

    if (insertError) {
      throw new HttpError(500, "Failed to send message", "MESSAGE_ERROR");
    }

    // Trigger a consolidated digest for the recipient (dev stub — logs/email stub)
    try {
      let recipientId: string | undefined;
      // thread.owner_id is the owner; thread.participant_ids may be an array of other participant ids
      if (thread) {
        if (thread.owner_id === user.id) {
          // pick first participant that is not the sender
          const participants = (thread.participant_ids as string[] | undefined) ?? undefined;
          recipientId = participants?.find((id) => id !== user.id) ?? undefined;
        } else {
          recipientId = thread.owner_id as string | undefined;
        }
      }

      if (recipientId) {
        try {
          await generateDigestForUser(recipientId, { trigger: "message" });
        } catch (e) {
          console.error("[digest] generateDigestForUser failed", e);
        }
      }
    } catch (e) {
      console.error("[digest] unexpected error", e);
    }

    // Update thread metadata
    await supabase!
      .from("message_threads")
      .update({
        last_message: payload.body,
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.threadId);

    const response = NextResponse.json({ success: true });
    response.headers.set("X-RateLimit-Reset", (now + MIN_INTERVAL_BETWEEN_MESSAGES).toString());
    return response;

  } catch (error) {
    return handleAuthError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await validateAuthRequest(request, { requireCsrf: false });
    
    // Get authenticated user
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) {
      throw new HttpError(401, "Authentication required", "AUTH_REQUIRED");
    }

    // Parse and validate query params
    const searchParams = new URL(request.url).searchParams;
    const query = MessageQueryParams.parse({
      threadId: searchParams.get("threadId") || undefined,
      before: searchParams.get("before") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined
    });

    // Build query
    let messagesQuery = supabase!
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(query.limit);

    if (query.threadId) {
      // Verify user is thread participant or owner
      const { data: thread, error: threadError } = await supabase!
        .from("message_threads")
        .select("participant_ids, owner_id")
        .eq("id", query.threadId)
        .single();

      if (threadError || !thread) {
        throw new HttpError(404, "Thread not found", "THREAD_NOT_FOUND");
      }

      if (thread.owner_id !== user.id && !thread.participant_ids?.includes(user.id)) {
        throw new HttpError(403, "Not authorized to view this thread", "NOT_PARTICIPANT");
      }

      messagesQuery = messagesQuery.eq("thread_id", query.threadId);
    } else {
      // Only fetch messages from threads where user is owner or participant
      const { data: threads } = await supabase!
        .from("message_threads")
        .select("id")
        .or(`owner_id.eq.${user.id},participant_ids.cs.{${user.id}}`);

      const threadIds = threads?.map(t => t.id) || [];
      if (threadIds.length === 0) {
        return NextResponse.json({ messages: [] });
      }
      
      messagesQuery = messagesQuery.in("thread_id", threadIds);
    }

    if (query.before) {
      messagesQuery = messagesQuery.lt("created_at", query.before);
    }

    const { data: messages, error } = await messagesQuery;

    if (error) {
      throw new HttpError(500, "Failed to fetch messages", "QUERY_ERROR");
    }

    return NextResponse.json({ messages });
  } catch (error) {
    return handleAuthError(error);
  }
}
