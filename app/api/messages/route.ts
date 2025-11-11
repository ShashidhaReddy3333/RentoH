import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { validateAuthRequest, handleAuthError } from "@/lib/http/auth";
import { HttpError } from "@/lib/http/errors";
import { MessageQueryParams } from "@/lib/validators/messages";
import { generateDigestForUser } from "@/lib/notifications/digest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateCsrfToken } from "@/lib/http/csrf";
import { rateLimit } from "@/lib/server/rate-limit";
import { logWarn } from "@/lib/server/logger";
import { verifyCaptchaToken } from "@/lib/server/captcha";

// Hardened message payload validator with strict UUID and string validation
const MessagePayload = z.object({
  threadId: z.string().uuid("Invalid thread ID format"),
  body: z.string().min(1, "Message body cannot be empty").max(2000, "Message body too long")
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body first for validation
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    // Validate CSRF token (double submit cookie pattern)
    const csrfToken = (requestBody as Record<string, unknown>)?.['csrf'] as string | undefined;
    if (!validateCsrfToken(csrfToken)) {
      return NextResponse.json(
        { error: "Invalid or missing CSRF token", code: "INVALID_CSRF" },
        { status: 403 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") ?? request.ip ?? "anon";
    if (!rateLimit(`POST:/api/messages:${ip}`)) {
      logWarn("rate_limited", { ip });
      return NextResponse.json(
        { error: "Too Many Requests", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const captchaToken = (requestBody as Record<string, unknown>)?.["captcha"] as string | undefined;
    const captchaResult = await verifyCaptchaToken(captchaToken, { ip, action: "message_post" });
    if (!captchaResult.success) {
      const status = captchaResult.required ? 403 : 400;
      return NextResponse.json(
        { error: "Captcha verification failed", code: captchaResult.message ?? "CAPTCHA_FAILED" },
        { status }
      );
    }

    // Validate payload schema with Zod
    const parseResult = MessagePayload.safeParse(requestBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request payload", 
          code: "VALIDATION_ERROR",
          details: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }
    const payload = parseResult.data;

    // Create Supabase server client and get session
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable", code: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify thread exists and user is a participant
    const { data: thread, error: threadError } = await supabase
      .from("message_threads")
      .select("tenant_id, landlord_id")
      .eq("id", payload.threadId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: "Thread not found", code: "THREAD_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Ensure sender.id === auth.uid() - verify user is thread participant
    const isTenant = thread.tenant_id === userId;
    const isLandlord = thread.landlord_id === userId;

    if (!isTenant && !isLandlord) {
      return NextResponse.json(
        { error: "Not authorized to send messages in this thread", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Insert message - sender_id is explicitly set to authenticated user ID
    const { data: newMessage, error: insertError } = await supabase
      .from("messages")
      .insert({
        thread_id: payload.threadId,
        sender_id: userId, // Ensures sender.id === auth.uid()
        body: payload.body
      })
      .select()
      .single();

    if (insertError || !newMessage) {
      console.error("[messages] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to send message", code: "MESSAGE_ERROR" },
        { status: 500 }
      );
    }

    // Determine recipient to increment their unread count
    const recipientId = userId === thread.landlord_id ? thread.tenant_id : thread.landlord_id;

    // Update thread metadata including unread count
    const { error: threadUpdateError } = await supabase
      .from("message_threads")
      .update({
        last_message: payload.body,
        last_message_at: newMessage.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.threadId);

    if (threadUpdateError) {
      console.error("[messages] Thread update error:", threadUpdateError);
    }

    // Increment unread count for recipient using SQL
    const { error: rpcError } = await supabase.rpc('increment_thread_unread_count', {
      p_thread_id: payload.threadId,
      p_user_id: recipientId
    });
    
    if (rpcError) {
      console.error("[messages] Failed to increment unread count:", rpcError);
      // Non-blocking error - continue anyway
    }

    // Trigger a consolidated digest for the recipient (dev stub — logs/email stub)
    try {
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

    return NextResponse.json(
      { 
        success: true,
        message: {
          id: newMessage.id,
          threadId: newMessage.thread_id,
          senderId: newMessage.sender_id,
          text: newMessage.body,
          createdAt: newMessage.created_at ?? new Date().toISOString()
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[messages] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
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
      // Verify user is thread participant
      const { data: thread, error: threadError } = await supabase!
        .from("message_threads")
        .select("tenant_id, landlord_id")
        .eq("id", query.threadId)
        .single();

      if (threadError || !thread) {
        throw new HttpError(404, "Thread not found", "THREAD_NOT_FOUND");
      }

      if (thread.tenant_id !== user.id && thread.landlord_id !== user.id) {
        throw new HttpError(403, "Not authorized to view this thread", "NOT_PARTICIPANT");
      }

      messagesQuery = messagesQuery.eq("thread_id", query.threadId);
    } else {
      // Only fetch messages from threads where user is a participant
      const { data: threads } = await supabase!
        .from("message_threads")
        .select("id")
        .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`);

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
