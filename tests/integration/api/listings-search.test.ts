import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/listings/search/route";
import { searchListings } from "@/lib/search/service";

vi.mock("@/lib/search/service", () => ({
  searchListings: vi.fn()
}));

describe("GET /api/listings/search", () => {
const mockSearch = vi.mocked(searchListings);

  beforeEach(() => {
    mockSearch.mockReset();
  });

  it("returns search results as JSON", async () => {
    mockSearch.mockResolvedValue({
      items: [],
      total: 0,
      hasMore: false
    });

    const request = new Request("http://localhost/api/listings/search?baths=2", {
      method: "GET"
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ items: [], total: 0, hasMore: false });
    expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ bathroomsMin: 2 }));
  });

  it("returns a 500 when search fails", async () => {
    mockSearch.mockRejectedValue(new Error("failure"));

    const request = new Request("http://localhost/api/listings/search", { method: "GET" });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toContain("Unable to load listings");
  });
});
