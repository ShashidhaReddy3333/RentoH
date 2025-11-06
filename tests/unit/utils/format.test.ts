import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/lib/utils/format";

describe("formatCurrency", () => {
  it("formats Canadian dollars without decimals by default", () => {
    expect(formatCurrency(1500)).toBe("$1,500");
  });

  it("respects alternative currency codes", () => {
    expect(formatCurrency(2400, "USD")).toBe("US$2,400");
  });

  it("rounds to the nearest dollar for fractional values", () => {
    expect(formatCurrency(1899.75)).toBe("$1,900");
  });
});

