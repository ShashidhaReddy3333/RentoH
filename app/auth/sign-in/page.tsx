"use client";

import clsx from "clsx";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import EmailOtpForm from "@/components/auth/EmailOtpForm";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="mx-auto max-w-2xl py-12 text-center text-sm text-textc/60">
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
        <h1 className="text-3xl font-semibold text-textc">Welcome back to Rento Bridge</h1>
        <p className="text-sm text-textc/70">
          Sign in or create an account to continue your tenant or landlord journey.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-6">
          <div className="flex rounded-full border border-black/10 bg-surface-muted p-1 text-sm font-medium dark:border-white/10">
            {tabs.map((option) => (
              <button
                key={option.key}
                role="tab"
                type="button"
                aria-selected={tab === option.key}
                onClick={() => handleTabChange(option.key)}
                className={clsx(
                  "flex-1 rounded-full px-4 py-2 transition",
                  tab === option.key
                    ? "bg-surface text-brand.primary shadow-soft"
                    : "text-textc/70 hover:text-brand.primary"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {tab === "email" ? <EmailOtpForm /> : <PhoneForm onStatus={setStatus} />}

          <button
            type="button"
            disabled
            className={`${buttonStyles({ variant: "outline" })} w-full cursor-not-allowed bg-surface-muted text-textc/50`}
          >
            Continue with Google (coming soon)
          </button>

          {status ? (
            <div
              role="status"
              className="rounded-lg border border-brand.primary/40 bg-brand.primary/5 px-4 py-3 text-sm text-brand.primary"
            >
              {status}
            </div>
          ) : null}

          <p className="text-center text-sm text-textc/70">
            Need help?{" "}
            <Link href="/contact" className="text-brand.blue hover:text-brand.primary hover:underline">
              Contact support
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

type StatusHandler = { onStatus: (message: string | null) => void };

function PhoneForm({ onStatus }: StatusHandler) {
  const [form, setForm] = useState({ phone: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);

  const requestOtp = () => {
    if (!form.phone) return;
    setOtpSent(true);
    onStatus("OTP sent! Enter the code we texted you to continue.");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!otpSent) {
      onStatus("Please request an OTP before continuing.");
      return;
    }
    onStatus("Success! Your phone number is verified and you are signed in.");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" aria-label="Phone authentication form">
      <InputField
        id="phone-number"
        label="Phone number"
        value={form.phone}
        onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
        placeholder="+1 (555) 000-1234"
        required
      />
      <div className="grid gap-1">
        <label htmlFor="phone-otp" className="text-sm font-medium text-textc">
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
          <button
            type="button"
            className={buttonStyles({ variant: "outline" })}
            onClick={requestOtp}
          >
            Send OTP
          </button>
        </div>
      </div>
      <button type="submit" className={buttonStyles({ variant: "primary" })}>
        Continue
      </button>
    </form>
  );
}

type InputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "password" | "tel";
};

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text"
}: InputFieldProps) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-medium text-textc">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="input"
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
