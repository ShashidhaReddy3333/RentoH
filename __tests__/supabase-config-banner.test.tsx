import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
});

describe("SupabaseConfigBanner", () => {
  it("shows configuration warning when Supabase env is missing", async () => {
    vi.doMock("@/lib/env", () => ({
      hasSupabaseEnv: false,
      missingSupabaseMessage:
        "Supabase environment variables are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file."
    }));
    const { SupabaseConfigBanner } = await import("@/components/SupabaseConfigBanner");
    render(<SupabaseConfigBanner />);
    expect(screen.getByRole("status")).toHaveTextContent("Supabase connection inactive");
  });

  it("renders nothing when Supabase is configured", async () => {
    vi.doMock("@/lib/env", () => ({
      hasSupabaseEnv: true,
      missingSupabaseMessage:
        "Supabase environment variables are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file."
    }));
    const { SupabaseConfigBanner } = await import("@/components/SupabaseConfigBanner");
    const { container } = render(<SupabaseConfigBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
