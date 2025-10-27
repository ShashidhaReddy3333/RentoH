"use client";

import type { PropertySort } from "@/lib/types";

export default function SortMenu({
  value,
  onChange
}: {
  value: PropertySort;
  onChange: (v: PropertySort) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
      Sort
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PropertySort)}
        className="rounded-full border border-black/5 bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
        data-testid="sort-select"
      >
        <option value="newest">Newest</option>
        <option value="priceAsc">Price (Low to High)</option>
        <option value="priceDesc">Price (High to Low)</option>
      </select>
    </label>
  );
}
