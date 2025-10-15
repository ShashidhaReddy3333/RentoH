"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type TabKey = "email" | "phone";

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInFallback() {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center text-sm text-gray-500">
      Loading sign-in experience...
    </div>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("email");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const param = searchParams.get("tab");
    if (param === "phone" || param === "email") {
      setTab(param);
    }
  }, [searchParams]);

  const tabs = useMemo(
    () => [
      { key: "email" as const, label: "Email" },
      { key: "phone" as const, label: "Phone" }
    ],
    []
  );

  const handleTabChange = (next: TabKey) => {
    setTab(next);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", next);
    router.replace(`?${nextParams.toString()}`, { scroll: false });
    setStatus(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-[var(--c-dark)]">Welcome back to Rento Bridge</h1>
        <p className="text-sm text-gray-600">
          Sign in or create an account to continue your tenant or landlord journey.
        </p>
      </header>

      <div className="card space-y-6">
        <div className="flex rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-medium">
          {tabs.map((option) => (
            <button
              key={option.key}
              role="tab"
              type="button"
              aria-selected={tab === option.key}
              onClick={() => handleTabChange(option.key)}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                tab === option.key
                  ? "bg-white text-[var(--c-primary)] shadow-soft"
                  : "text-gray-600 hover:text-[var(--c-primary)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {tab === "email" ? <EmailForm onStatus={setStatus} /> : <PhoneForm onStatus={setStatus} />}

        <button type="button" disabled className="btn w-full border border-gray-300 bg-gray-100 text-gray-500">
          Continue with Google (coming soon)
        </button>

        {status && (
          <div
            role="status"
            className="rounded-lg border border-[var(--c-primary)]/40 bg-[var(--c-primary)]/5 px-4 py-3 text-sm text-[var(--c-primary)]"
          >
            {status}
          </div>
        )}

        <p className="text-center text-sm text-gray-600">
          Need help? {" "}
          <Link href="/contact" className="text-[var(--c-blue)] hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}

type StatusHandler = { onStatus: (message: string | null) => void };

function EmailForm({ onStatus }: StatusHandler) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onStatus(`Thanks ${form.name || "there"}! Check your inbox to confirm your account.`);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" aria-label="Email authentication form">
      <div className="grid gap-1">
        <label htmlFor="email-name" className="text-sm font-medium text-gray-700">
          Name (for signup)
        </label>
        <input
          id="email-name"
          className="input"
          placeholder="Jordan Tenant"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="email-address" className="text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email-address"
          type="email"
          className="input"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="email-password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="email-password"
          type="password"
          className="input"
          placeholder="********"
          required
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Continue
      </button>
    </form>
  );
}

function PhoneForm({ onStatus }: StatusHandler) {
  const [form, setForm] = useState({ phone: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);

  const requestOtp = () => {
    if (!form.phone) return;
    setOtpSent(true);
    onStatus("OTP sent! Enter the code we texted you to continue.");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!otpSent) {
      onStatus("Please request an OTP before continuing.");
      return;
    }
    onStatus("Success! Your phone number is verified and you are signed in.");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" aria-label="Phone authentication form">
      <div className="grid gap-1">
        <label htmlFor="phone-number" className="text-sm font-medium text-gray-700">
          Phone number
        </label>
        <input
          id="phone-number"
          className="input"
          placeholder="+1 (555) 000-1234"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          required
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="phone-otp" className="text-sm font-medium text-gray-700">
          One-time passcode
        </label>
        <div className="flex gap-2">
          <input
            id="phone-otp"
            className="input"
            placeholder="Enter code"
            value={form.otp}
            onChange={(event) => setForm((prev) => ({ ...prev, otp: event.target.value }))}
          />
          <button type="button" className="btn btn-secondary whitespace-nowrap" onClick={requestOtp}>
            Send OTP
          </button>
        </div>
      </div>
      <button type="submit" className="btn btn-primary">
        Continue
      </button>
    </form>
  );
}
