"use client";

import { useCallback, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/solid";

type FavoriteButtonProps = {
  propertyId: string;
  initialSaved?: boolean;
};

function showToast(message: string, opts: { success?: boolean } = {}) {
  const id = `rento-toast-${Date.now()}`;
  const el = document.createElement("div");
  el.id = id;
  el.className = "fixed bottom-6 right-6 z-50 rounded-md px-4 py-2 text-sm font-medium shadow-lg";
  el.style.background = opts.success ? "#DCFCE7" : "#FEF3C7";
  el.style.color = "#0f172a";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity 180ms ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 200);
  }, 2000);
}

function extractMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const rec = err as Record<string, unknown>;
    const m = rec["message"] ?? rec["error"];
    if (typeof m === "string") return m;
  }
  return undefined;
}

export default function FavoriteButton({ propertyId, initialSaved = false }: FavoriteButtonProps) {
  const [saved, setSaved] = useState<boolean>(initialSaved);
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(async () => {
    if (busy) return;
    const next = !saved;
    // optimistic
    setSaved(next);
    setBusy(true);
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || "Failed to update favorite");
      }

      showToast(next ? "Saved to favorites" : "Removed from favorites", { success: true });
    } catch (err: unknown) {
      // revert optimistic
      setSaved(!next);
      console.error("Favorite toggle failed", err);
      const m = extractMessage(err) ?? "Action failed";
      showToast(m);
    } finally {
      setBusy(false); // Revert busy state regardless of success or failure
    }
  }, [saved, propertyId, busy]);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from favorites" : "Save listing"}
      aria-pressed={saved}
      onClick={toggle}
      disabled={busy}
      data-testid="property-save"
      className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-teal shadow-soft transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        saved ? "text-red-500" : ""
      }`}
    >
      <HeartIcon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
