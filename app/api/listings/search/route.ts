import { NextResponse } from "next/server";
import { z } from "zod";

import { getMany } from "@/lib/data-access/properties";
import type { PropertyFilters, PropertySort } from "@/lib/types";

export const dynamic = "force-dynamic";

const SearchParamsSchema = z.object({
  city: z.string().min(1).optional(),
  min: z.coerce.number().nonnegative().optional(),
  max: z.coerce.number().nonnegative().optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  type: z.enum(["apartment", "condo", "house", "townhouse"]).optional(),
  pets: z.enum(["true", "false"]).optional(),
  furnished: z.enum(["true", "false"]).optional(),
  verified: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(["newest", "priceAsc", "priceDesc"]).default("newest")
});

export async function GET(request: Request) {
  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = SearchParamsSchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  }

  const { page, sort, ...rest } = parsed.data;
  const filters = mapFilters(rest);

  try {
    const result = await getMany(filters, sort as PropertySort, page);
    return NextResponse.json({ items: result.items, nextPage: result.nextPage });
  } catch (error) {
    console.error("[listings] Failed to load listings", error);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
  }
}

function mapFilters(input: Omit<z.infer<typeof SearchParamsSchema>, "page" | "sort">): PropertyFilters {
  const filters: PropertyFilters = {};

  if (input.city) filters.city = input.city;
  if (input.min != null) filters.min = input.min;
  if (input.max != null) filters.max = input.max;
  if (input.beds != null) filters.beds = input.beds;
  if (input.baths != null) filters.baths = input.baths;
  if (input.type) filters.type = input.type;
  if (input.pets) filters.pets = input.pets === "true";
  if (input.furnished) filters.furnished = input.furnished === "true";
  if (input.verified) filters.verified = input.verified === "true";

  return filters;
}