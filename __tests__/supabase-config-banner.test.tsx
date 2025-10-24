import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
});

describe("SupabaseConfigBanner", () => {
  it("shows configuration warning when Supabase env is missing", async () => {
    vi.doMock("@/lib/env", () => ({ hasSupabaseEnv: false }));
    const { SupabaseConfigBanner } = await import("@/components/SupabaseConfigBanner");
    render(<SupabaseConfigBanner />);
    expect(screen.getByRole("status")).toHaveTextContent("Supabase connection inactive");
  });

  it("renders nothing when Supabase is configured", async () => {
    vi.doMock("@/lib/env", () => ({ hasSupabaseEnv: true }));
    const { SupabaseConfigBanner } = await import("@/components/SupabaseConfigBanner");
    const { container } = render(<SupabaseConfigBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
