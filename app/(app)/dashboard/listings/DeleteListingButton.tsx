"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteListing } from "./actions";
import { buttonStyles } from "@/components/ui/button";

type DeleteListingButtonProps = {
  listingId: string;
  listingTitle: string;
};

export function DeleteListingButton({ listingId, listingTitle }: DeleteListingButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = () => {
    const confirmed = window.confirm(`Are you sure you want to delete "${listingTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteListing(listingId);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className={buttonStyles({ variant: "danger", size: "sm" })}
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
