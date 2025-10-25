import { describe, expect, it, vi } from "vitest";
import { hasSupabaseEnv } from "@/lib/env";
import { isDevelopment, warnAboutMissingSupabase } from "@/lib/development";

describe("Environment & Development Utils", () => {
  it("should correctly detect development environment", () => {
    // The test environment is considered development
    expect(isDevelopment()).toBe(true);
  });

  it("should warn about missing Supabase config in development", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    warnAboutMissingSupabase("test-context");
    
    if (!hasSupabaseEnv) {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[test-context] Supabase environment variables missing")
      );
    }
    
    consoleSpy.mockRestore();
  });

  it("should validate Supabase environment", () => {
    // This just makes sure the value is boolean and matches the environment
    expect(typeof hasSupabaseEnv).toBe("boolean");
    expect(hasSupabaseEnv).toBe(
      Boolean(process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'])
    );
  });
});