import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("env module", () => {
  it("reports Supabase as unavailable when keys are missing", async () => {
    process.env = { ...process.env };
    delete process.env["NEXT_PUBLIC_SUPABASE_URL"];
    delete process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    const { hasSupabaseEnv } = await import("@/lib/env");
    expect(hasSupabaseEnv).toBe(false);
  });

  it("reports Supabase as available when both keys are present", async () => {
    process.env = {
      ...process.env,
      ["NEXT_PUBLIC_SUPABASE_URL"]: "https://example.supabase.co",
      ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]: "abcdefghijklmnopqrstuvwxyz1234567890"
    };

    const { hasSupabaseEnv } = await import("@/lib/env");
    expect(hasSupabaseEnv).toBe(true);
  });
});