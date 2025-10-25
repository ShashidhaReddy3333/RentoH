import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateDigestForUser } from "@/lib/notifications/digest";
import { getCurrentUserPreferences, upsertCurrentUserPreferences } from "@/lib/data-access/userPreferences";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/auth", () => ({
  getSupabaseClientWithUser: vi.fn()
}));

describe("notification preferences and digest system", () => {
  const mockUser = { id: "test-user-1" };
  const mockPrefs = {
    emailNotifications: {
      newMessages: true,
      applications: true,
      tours: true
    },
    smsNotifications: {
      newMessages: false,
      applications: false,
      tours: false
    }
  };

  // Common mock setup
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn()
  };

  beforeEach(() => {
    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("digest respects user preferences", async () => {
    // Mock preferences query
    mockSupabase.maybeSingle.mockResolvedValueOnce({ 
      data: {
        email_notifications: { newMessages: true, applications: false },
        sms_notifications: { newMessages: false, applications: false }
      }
    });

    // Mock message threads query
    mockSupabase.select.mockImplementationOnce(() => ({
      ...mockSupabase,
      maybeSingle: vi.fn().mockResolvedValue({ data: [{ id: "thread-1" }] })
    }));

    // Mock messages query - should be called since newMessages: true
    mockSupabase.limit.mockImplementationOnce(() => ({
      ...mockSupabase,
      maybeSingle: vi.fn().mockResolvedValue({
        data: [
          { id: "msg-1", thread_id: "thread-1", body: "Hello", created_at: new Date().toISOString() }
        ]
      })
    }));

    // Mock applications query - should NOT be called since applications: false
    mockSupabase.limit.mockImplementationOnce(() => ({
      ...mockSupabase,
      maybeSingle: vi.fn().mockResolvedValue({ data: [] })
    }));

    const consoleSpy = vi.spyOn(console, "log");
    await generateDigestForUser(mockUser.id, { trigger: "test" });

    // Should have logged digest with messages but no applications
    // Find the digest log entry
    const digestLogEntry = consoleSpy.mock.calls.find(call => 
      call[0] === "[digest] Generated digest for user:"
    );

    expect(digestLogEntry).toBeDefined();
    const digestLog = digestLogEntry ? JSON.parse(digestLogEntry[1]) : null;
    expect(digestLog).toBeDefined();
    expect(digestLog!.messagesCount).toBeGreaterThan(0);
    expect(digestLog!.applicationsCount).toBe(0);
  });
});