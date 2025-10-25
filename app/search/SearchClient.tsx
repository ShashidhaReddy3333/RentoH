"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";

import SortMenu from "@/components/SortMenu";
import type { Property, PropertySort } from "@/lib/types";

export default function SearchClient({
  initialSort,
  properties
}: {
  initialSort: PropertySort;
  properties: Property[];
}) {
  const [sort, setSort] = useState(initialSort);
  const router = useRouter();
  const pathname = usePathname();

  const handleSortChange = useCallback((newSort: PropertySort) => {
    setSort(newSort);
    const search = new URLSearchParams(window.location.search);
    search.set("sort", newSort);
    router.push(`${pathname}?${search.toString()}` as Route);
  }, [pathname, router]);

  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white px-4 py-3 shadow-soft">
      <div className="text-sm text-text-muted">
        {properties.length} results
      </div>
      <div className="flex items-center gap-2">
        <SortMenu value={sort} onChange={handleSortChange} />
      </div>
    </div>
  );
}