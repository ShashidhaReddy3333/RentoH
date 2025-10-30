import { describe, expect, it } from "vitest";

import { createSlug } from "@/lib/utils/slug";

describe("createSlug", () => {
  it("normalizes text to lowercase hyphenated form", () => {
    expect(createSlug(" Downtown Loft ")).toBe("downtown-loft");
  });

  it("strips diacritics and non alphanumeric characters", () => {
    expect(createSlug("L'été à Montréal!")).toBe("l-ete-a-montreal");
  });

  it("falls back to default slug when input is empty", () => {
    expect(createSlug("")).toBe("listing");
  });
});
