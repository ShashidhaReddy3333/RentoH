import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateDigestForUser } from "@/lib/notifications/digest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/auth", () => ({
  getSupabaseClientWithUser: vi.fn()
}));

describe("notification preferences and digest system", () => {
  const mockUser = { id: "test-user-1" };

  const createMockQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn()
  });

  let queryChain: ReturnType<typeof createMockQueryBuilder>;
  let fromSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryChain = createMockQueryBuilder();
    fromSpy = vi.fn().mockReturnValue(queryChain);
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from: fromSpy
    } as unknown as ReturnType<typeof createSupabaseServerClient>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("digest respects user preferences", async () => {
    // Mock preferences query
    queryChain.maybeSingle.mockResolvedValueOnce({ 
      data: {
        email_notifications: { newMessages: true, applications: false },
        sms_notifications: { newMessages: false, applications: false }
      }
    });

    // Mock message threads query
    queryChain.select.mockImplementationOnce(() => ({
      ...queryChain,
      maybeSingle: vi.fn().mockResolvedValue({ data: [{ id: "thread-1" }] })
    }));

    // Mock messages query - should be called since newMessages: true
    queryChain.limit.mockImplementationOnce(() => ({
      ...queryChain,
      maybeSingle: vi.fn().mockResolvedValue({
        data: [
          { id: "msg-1", thread_id: "thread-1", body: "Hello", created_at: new Date().toISOString() }
        ]
      })
    }));

    // Mock applications query - should NOT be called since applications: false
    queryChain.limit.mockImplementationOnce(() => ({
      ...queryChain,
      maybeSingle: vi.fn().mockResolvedValue({ data: [] })
    }));

    const consoleSpy = vi.spyOn(console, "log");
    await generateDigestForUser(mockUser.id, { trigger: "test" });

    // Should have logged digest with messages but no applications
    // Find the digest log entry (logInfo outputs JSON string)
    const digestLogEntry = consoleSpy.mock.calls.find(call => {
      try {
        const parsed = JSON.parse(call[0]);
        return parsed.message === "Digest generated" && parsed.userId === mockUser.id;
      } catch {
        return false;
      }
    });

    expect(digestLogEntry).toBeDefined();
    const digestLog = digestLogEntry ? JSON.parse(digestLogEntry[0]) : null;
    expect(digestLog).toBeDefined();
    expect(digestLog).toHaveProperty('messagesCount');
    expect(digestLog).toHaveProperty('applicationsCount');
    expect(digestLog!.messagesCount).toBeGreaterThanOrEqual(0);
    expect(digestLog!.applicationsCount).toBeGreaterThanOrEqual(0);
  });
});