"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiltersPanel } from "@/components/search/filters-panel";
import { ListingsList } from "@/components/search/listings-list";
import { ListingsMap } from "@/components/search/listings-map";
import { SearchLayout } from "@/components/search/search-layout";
import { useSearchFilters } from "@/components/search/use-search-filters";
import { serializeSearchFilters } from "@/lib/search/params";
import type { ListingSummary, SearchFilters, SearchResult } from "@/lib/search/types";

type SearchViewProps = {
  initialFilters: SearchFilters;
  initialResult: SearchResult;
};

type SearchPayload = {
  items: ListingSummary[];
  total: number;
  hasMore: boolean;
};

export function SearchView({ initialFilters, initialResult }: SearchViewProps) {
  const { filters, setFilter, setFilters, toggleAmenity, clearFilters } = useSearchFilters({
    defaults: initialFilters
  });
  const [result, setResult] = useState<SearchPayload>(initialResult);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialResult.items[0]?.id ?? null);
  const [refreshSequence, setRefreshSequence] = useState(0);
  const lastQueryRef = useRef<string | null>(serializeSearchFilters(initialFilters));

  const serializedFilters = useMemo(() => serializeSearchFilters(filters), [filters]);

  useEffect(() => {
    const skipInitial =
      serializedFilters === lastQueryRef.current && refreshSequence === 0;
    if (skipInitial) {
      return;
    }

    const controller = new AbortController();
    const shouldResetSequence = refreshSequence !== 0;

    setStatus("loading");
    setError(null);

    const query = serializedFilters ? `?${serializedFilters}` : "";

    fetch(`/api/listings/search${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Search request failed");
        }
        return response.json() as Promise<SearchPayload>;
      })
      .then((payload) => {
        setResult(payload);
        setStatus("idle");
        lastQueryRef.current = serializedFilters;
        if (shouldResetSequence) {
          setRefreshSequence(0);
        }

        setSelectedId((current) => {
          if (current && payload.items.some((item) => item.id === current)) {
            return current;
          }
          return payload.items[0]?.id ?? null;
        });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setStatus("error");
        setError(err.message ?? "Unable to load listings.");
        lastQueryRef.current = serializedFilters;
      });

    return () => controller.abort();
  }, [serializedFilters, refreshSequence]);

  const isLoading = status === "loading";

  const handleRetry = () => {
    setRefreshSequence((seq) => seq + 1);
  };

  return (
    <div className="space-y-6">
      <FiltersPanel
        filters={filters}
        setFilter={setFilter}
        setFilters={setFilters}
        toggleAmenity={toggleAmenity}
        clearFilters={clearFilters}
      />
      <SearchLayout
        list={
          <ListingsList
            items={result.items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
          />
        }
        map={
          <ListingsMap
            items={result.items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isLoading={isLoading}
          />
        }
      />
    </div>
  );
}
