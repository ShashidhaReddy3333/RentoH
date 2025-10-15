"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { sendEmailOtp } from "@/lib/auth/otp";

export default function EmailOtpForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await sendEmailOtp(email);
      setMsg("Check your inbox for the sign-in link (and Spam/Promotions).");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErr(error.message || "Could not send OTP. Try again.");
      } else {
        setErr("Could not send OTP. Try again.");
      }
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
      <button disabled={busy} className="rounded-md bg-brand-teal px-4 py-2 text-white">
        {busy ? "Sending..." : "Send OTP"}
      </button>
      {msg && <p className="text-sm text-brand-green">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
