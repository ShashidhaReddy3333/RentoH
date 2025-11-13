"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, MapPinIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";

const POPULAR_CITIES = [
  "Waterloo",
  "Kitchener",
  "Cambridge",
  "Guelph",
  "Toronto",
  "Mississauga",
  "Hamilton",
  "London"
];

const RECENT_SEARCHES_KEY = "rento_recent_searches";
const MAX_RECENT = 5;

export function SearchWithSuggestions() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      saveSearch(trimmed);
      router.push(`/browse?city=${encodeURIComponent(trimmed)}`);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const filteredCities = POPULAR_CITIES.filter((city) =>
    city.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-4 h-5 w-5 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search by city or neighborhood..."
              className="w-full rounded-2xl border border-brand-outline/60 bg-white py-3.5 pl-12 pr-14 text-sm text-textc shadow-sm transition placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-2"
              aria-label="Search for properties by city or neighborhood"
              aria-controls={showSuggestions ? "search-suggestions" : undefined}
              aria-autocomplete="list"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-14 inline-flex h-6 w-6 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-brand-dark"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="submit"
            data-testid="search-submit"
            className="w-full rounded-2xl bg-brand-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primaryStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 sm:w-auto"
          >
            Search
          </button>
        </div>
      </form>

      {showSuggestions && (query || recentSearches.length > 0) && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-brand-outline/60 bg-white py-2 shadow-lg"
        >
          {recentSearches.length > 0 && !query && (
            <div className="px-4 py-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-xs font-medium text-brand-primary hover:text-brand-primaryStrong"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSearch(search)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-muted"
                  role="option"
                  aria-selected="false"
                >
                  <ClockIcon className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <span className="text-textc">{search}</span>
                </button>
              ))}
            </div>
          )}

          {query && filteredCities.length > 0 && (
            <div className="px-4 py-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                {recentSearches.length > 0 && !query ? "Popular Cities" : "Suggestions"}
              </span>
              {filteredCities.map((city, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSearch(city)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-muted"
                  role="option"
                  aria-selected="false"
                >
                  <MapPinIcon className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                  <span className="text-textc">{city}</span>
                </button>
              ))}
            </div>
          )}

          {query && filteredCities.length === 0 && (
            <div className="px-4 py-3 text-center text-sm text-text-muted">
              No matching cities found. Try searching for nearby areas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
