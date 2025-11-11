"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/lib/types";

export function useFavorites() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/favorites/list", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        let message = "Failed to fetch favorites";
        try {
          const body = await res.json();
          if (body && typeof body === "object") {
            message = body.error || body.message || message;
          }
        } catch {}
        throw new Error(message);
      }

      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error("[useFavorites] Error fetching favorites:", err);
      setError(err instanceof Error ? err.message : "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const refresh = useCallback(() => {
    fetchFavorites();
    router.refresh();
  }, [fetchFavorites, router]);

  return {
    favorites,
    loading,
    error,
    refresh
  };
}
