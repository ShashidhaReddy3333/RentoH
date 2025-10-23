import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const MessagePayload = z.object({
  threadId: z.string().min(1),
  listingId: z.string().min(1),
  recipientId: z.string().min(1),
  body: z.string().min(1).max(2000)
});

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let parsedBody: z.infer<typeof MessagePayload>;
  try {
    const json = await req.json();
    const result = MessagePayload.safeParse(json);
    if (!result.success) {
      return new Response("Bad Request", { status: 400 });
    }
    parsedBody = result.data;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { threadId, listingId, recipientId, body } = parsedBody;

  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    listing_id: listingId,
    recipient_id: recipientId,
    sender_id: user.id,
    body
  });

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return new Response(null, { status: 204 });
}
