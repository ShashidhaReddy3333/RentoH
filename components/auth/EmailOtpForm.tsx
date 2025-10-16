"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { sendEmailOtp } from "@/lib/auth/otp";

export default function EmailOtpForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);

  const storageKey = useMemo(() => (email ? `otpCooldown:${email.toLowerCase()}` : null), [email]);
  const COOLDOWN_SECONDS = 60;

  useEffect(() => {
    if (!storageKey) return;
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (raw) {
      const until = Number(raw);
      if (!Number.isNaN(until)) {
        const tick = () => {
          const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
          setCooldownLeft(remaining);
          if (remaining <= 0) {
            window.clearInterval(timer);
          }
        };
        const timer = window.setInterval(tick, 1000);
        tick();
        return () => window.clearInterval(timer);
      }
    }
    setCooldownLeft(0);
  }, [storageKey]);

  function startCooldown() {
    if (!storageKey) return;
    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(until));
    }
    setCooldownLeft(COOLDOWN_SECONDS);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await sendEmailOtp(email);
      setMsg("Check your inbox for the sign-in link (and Spam/Promotions).");
      startCooldown();
    } catch (error: unknown) {
      let friendly = "Could not send OTP. Try again.";
      if (error instanceof Error) {
        const msg = error.message || friendly;
        if (msg.toLowerCase().includes("confirmation email") || msg.toLowerCase().includes("smtp")) {
          friendly = "Email sending failed. Check Supabase Auth → Email settings (custom SMTP or use default).";
        } else if (msg.toLowerCase().includes("rate limit") || msg.includes("429")) {
          friendly = "You're trying too often. Please wait a moment and try again.";
          startCooldown();
        } else if (msg.toLowerCase().includes("redirect")) {
          friendly = "Redirect not allowed. Add /auth/callback to Supabase Allowed Redirect URLs.";
        } else {
          friendly = msg;
        }
      }
      setErr(friendly);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border px-3 py-2"
        aria-label="Email"
      />
      <button disabled={busy || cooldownLeft > 0} className="rounded-md bg-brand-teal px-4 py-2 text-white disabled:opacity-60">
        {busy ? "Sending..." : cooldownLeft > 0 ? `Resend in ${cooldownLeft}s` : "Send OTP"}
      </button>
      {msg && <p className="text-sm text-brand-green">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
