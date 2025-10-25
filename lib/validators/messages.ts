import { z } from "zod";

export const MessagePayload = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

export const MessageQueryParams = z.object({
  threadId: z.string().uuid().optional(),
  before: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type Message = z.infer<typeof MessagePayload>;
export type MessageQuery = z.infer<typeof MessageQueryParams>;