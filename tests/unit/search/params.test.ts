import { describe, expect, it } from "vitest";

import {
  buildSearchHref,
  parseSearchParams,
  serializeSearchFilters
} from "@/lib/search/params";

describe("search params helpers", () => {
  it("parses query params into typed filters", () => {
    const params = new URLSearchParams({
      q: "waterloo ",
      minPrice: "1200",
      maxPrice: "2200",
      beds: "2",
      amenities: "parking,invalid,pet_friendly"
    });

    const filters = parseSearchParams(params);

    expect(filters).toEqual({
      location: "waterloo",
      priceMin: 1200,
      priceMax: 2200,
      bedroomsMin: 2,
      amenities: ["parking", "pet_friendly"]
    });
  });

  it("serializes filters to a stable query string", () => {
    const query = serializeSearchFilters({
      location: "downtown",
      amenities: ["parking", "parking", "pet_friendly"],
      propertyTypes: ["apartment", "studio"]
    });

    expect(query).toBe("q=downtown&types=apartment%2Cstudio&amenities=parking%2Cpet_friendly");
  });

  it("builds search hrefs with or without query", () => {
    expect(buildSearchHref("/search", {})).toBe("/search");
    expect(
      buildSearchHref("/search", {
        location: "uptown",
        priceMin: 1500
      })
    ).toBe("/search?q=uptown&minPrice=1500");
  });
});
