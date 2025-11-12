"use client";

import { useEffect } from "react";

import {
  RECENTLY_VIEWED_MAX,
  RECENTLY_VIEWED_STORAGE_KEY,
  RECENTLY_VIEWED_UPDATED_EVENT,
  type RecentlyViewedProperty
} from "@/components/recently-viewed/types";

type TrackerProps = {
  property: RecentlyViewedProperty;
};

export function RecentlyViewedTracker({ property }: TrackerProps) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
      const stored: RecentlyViewedProperty[] = raw ? JSON.parse(raw) : [];
      const filtered = stored.filter((item) => item.id !== property.id);
      const next = [property, ...filtered].slice(0, RECENTLY_VIEWED_MAX);
      window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(RECENTLY_VIEWED_UPDATED_EVENT));
    } catch (error) {
      console.warn("[recently-viewed] Failed to persist recent property", error);
    }
  }, [property]);

  return null;
}
