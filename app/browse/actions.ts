"use server";

import { getMany } from "@/lib/data-access/properties";
import type { PropertyFilters, PropertySort } from "@/lib/types";

export async function fetchMoreProperties(
  filters: PropertyFilters,
  sort: PropertySort,
  page: number
) {
  return getMany(filters, sort, page);
}
