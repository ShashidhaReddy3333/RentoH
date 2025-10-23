"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";

import AvatarUploader from "@/components/AvatarUploader";
import PreferenceToggles from "@/components/PreferenceToggles";
import { buttonStyles } from "@/components/ui/button";
import type { Profile } from "@/lib/types";

type ProfileFormProps = {
  profile: Profile;
  onSave: (patch: Partial<Profile>) => Promise<void>;
};

export default function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [form, setForm] = useState<Profile>(profile);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const areasInput = useMemo(
    () => form.prefs.areas?.join(", ") ?? "",
    [form.prefs.areas]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await onSave(form);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } catch (err) {
        console.error(err);
        setError("We couldn't save your profile right now. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">
      {success && (
        <div className="rounded-2xl border border-brand-green/40 bg-brand-green/10 px-4 py-3 text-sm font-semibold text-brand-green">
          Profile updated successfully.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-3 text-sm font-semibold text-brand-blue">
          {error}
        </div>
      )}

      <section aria-labelledby="account-section" className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <header className="space-y-1">
          <h2 id="account-section" className="text-lg font-semibold text-brand-dark">
            Account
          </h2>
          <p className="text-sm text-text-muted">Manage your basic information and avatar.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
          <AvatarUploader
            value={form.avatarUrl}
            onChange={(value) => setForm((prev) => ({ ...prev, avatarUrl: value }))}
          />
          <div className="grid gap-4">
            <FormField label="Full name" htmlFor="profile-name">
              <input
                id="profile-name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="input"
                required
              />
            </FormField>
            <FormField label="Email" htmlFor="profile-email">
              <input
                id="profile-email"
                value={form.email}
                readOnly
                className="input bg-surface-muted"
              />
            </FormField>
            <FormField label="Phone" htmlFor="profile-phone">
              <input
                id="profile-phone"
                value={form.phone ?? ""}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                className="input"
              />
            </FormField>
          </div>
        </div>
      </section>

      <section aria-labelledby="preferences-section" className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <header className="space-y-1">
          <h2 id="preferences-section" className="text-lg font-semibold text-brand-dark">
            Preferences
          </h2>
          <p className="text-sm text-text-muted">
            We use these to personalize listings and recommendations.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Budget (min)" htmlFor="prefs-budget-min">
            <input
              id="prefs-budget-min"
              type="number"
              min={0}
              value={form.prefs.budgetMin ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  prefs: { ...prev.prefs, budgetMin: numberOrUndefined(event.target.value) }
                }))
              }
              className="input"
            />
          </FormField>
          <FormField label="Budget (max)" htmlFor="prefs-budget-max">
            <input
              id="prefs-budget-max"
              type="number"
              min={0}
              value={form.prefs.budgetMax ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  prefs: { ...prev.prefs, budgetMax: numberOrUndefined(event.target.value) }
                }))
              }
              className="input"
            />
          </FormField>
          <FormField label="Beds" htmlFor="prefs-beds">
            <input
              id="prefs-beds"
              type="number"
              min={0}
              value={form.prefs.beds ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  prefs: { ...prev.prefs, beds: numberOrUndefined(event.target.value) }
                }))
              }
              className="input"
            />
          </FormField>
          <FormField label="Baths" htmlFor="prefs-baths">
            <input
              id="prefs-baths"
              type="number"
              min={0}
              value={form.prefs.baths ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  prefs: { ...prev.prefs, baths: numberOrUndefined(event.target.value) }
                }))
              }
              className="input"
            />
          </FormField>
          <FormField label="Preferred areas" htmlFor="prefs-areas" className="md:col-span-2">
            <input
              id="prefs-areas"
              value={areasInput}
              onChange={(event) => {
                const nextAreas = event.target.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean);
                setForm((prev) => ({ ...prev, prefs: { ...prev.prefs, areas: nextAreas } }));
              }}
              className="input"
              placeholder="Example: Waterloo, Downtown Kitchener"
            />
          </FormField>
          <label className="flex items-center gap-3 rounded-2xl border border-black/5 bg-surface px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(form.prefs.pets)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  prefs: { ...prev.prefs, pets: event.target.checked }
                }))
              }
              className="h-5 w-5 rounded border border-brand-teal/40 text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            />
            <span className="text-sm font-medium text-brand-dark">Pet-friendly homes</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-black/5 bg-surface px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(form.prefs.furnished)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  prefs: { ...prev.prefs, furnished: event.target.checked }
                }))
              }
              className="h-5 w-5 rounded border border-brand-teal/40 text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            />
            <span className="text-sm font-medium text-brand-dark">Prefer furnished</span>
          </label>
        </div>
      </section>

      <section aria-labelledby="notifications-section" className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <header className="space-y-1">
          <h2 id="notifications-section" className="text-lg font-semibold text-brand-dark">
            Notifications
          </h2>
          <p className="text-sm text-text-muted">
            Choose how you want to stay updated with landlords and applications.
          </p>
        </header>
        <PreferenceToggles
          value={form.notifications}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              notifications: value
            }))
          }
        />
      </section>

      <section aria-labelledby="verification-section" className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <header className="space-y-1">
          <h2 id="verification-section" className="text-lg font-semibold text-brand-dark">
            Verification
          </h2>
          <p className="text-sm text-text-muted">
            Build trust with landlords by completing identity verification.
          </p>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-dark capitalize">
              Status: {form.verificationStatus}
            </p>
            <p className="text-xs text-text-muted">
              Verification helps landlords fast-track your application.
            </p>
          </div>
          <button
            type="button"
            className={buttonStyles({ variant: "outline", size: "sm" })}
            data-testid="verification-start"
          >
            Start verification
          </button>
        </div>
      </section>

      <section aria-labelledby="danger-section" className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6">
        <header className="space-y-1">
          <h2 id="danger-section" className="text-lg font-semibold text-red-700">
            Danger zone
          </h2>
          <p className="text-sm text-red-500">
            Deleting your account removes saved homes and messages. This action cannot be undone.
          </p>
        </header>
        <button
          type="button"
          className="w-fit rounded-full border border-red-500 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Delete account
        </button>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          className={buttonStyles({ variant: "primary", size: "lg" })}
          disabled={isPending}
          data-testid="profile-save"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  className
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={`grid gap-2 text-sm font-semibold text-text-muted ${className ?? ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function numberOrUndefined(value: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

