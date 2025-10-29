"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    setQuery(params?.get("keywords") ?? "");
  }, [params]);

  const handleSortChange = useCallback(
    (newSort: PropertySort) => {
      setSort(newSort);
      const search = new URLSearchParams(window.location.search);
      search.set("sort", newSort);
      router.push(`${pathname}?${search.toString()}` as Route);
    },
    [pathname, router]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const search = new URLSearchParams(window.location.search);
      if (query) {
        search.set("keywords", query);
      } else {
        search.delete("keywords");
      }
      router.replace(`${pathname}?${search.toString()}` as Route, { scroll: false });
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname, query, router]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white px-4 py-3 shadow-soft">
      <div className="flex flex-1 items-center gap-2 text-sm text-text-muted">
        <span>{properties.length} results</span>
        <label className="sr-only" htmlFor="search-keywords">
          Search keywords
        </label>
        <input
          id="search-keywords"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="input h-9 max-w-xs"
          placeholder="Filter by keyword"
          type="search"
        />
      </div>
      <div className="flex items-center gap-2">
        <SortMenu value={sort} onChange={handleSortChange} />
      </div>
    </div>
  );
}
