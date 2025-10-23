"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { buttonStyles } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const supabase = useMemo(() => {
    if (!hasSupabaseEnv) return null;
    return createSupabaseBrowserClient();
  }, []);

  const handleSignOut = async () => {
    if (!supabase) {
      router.push("/auth/sign-in");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[auth] signOut failed", error);
      }
    } finally {
      setBusy(false);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={clsx(buttonStyles({ variant: "ghost", size: "sm" }), className)}
      disabled={busy}
      aria-label="Sign out of your Rento account"
    >
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
