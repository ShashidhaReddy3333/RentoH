"use client";

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";
import { profileUpdateSchema } from "@/lib/schemas/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/profile";

type ContactMethod = Exclude<Profile["contact_method"], null | undefined>;

type ProfileFormInitial = {
  full_name: string | null;
  phone: string | null;
  role: Profile["role"];
  city: string | null;
  address: string | null;
  contact_method: Profile["contact_method"];
  dob: string | null;
  avatar_url: string | null;
};

type Props = {
  initialProfile: ProfileFormInitial | null;
  initialPrefs: Record<string, unknown>;
  email: string;
};

type FormState = {
  full_name: string;
  phone: string;
  role: Profile["role"];
  city: string;
  address: string;
  contact_method: ContactMethod;
  dob: string;
  avatar_url: string | null;
};

type Feedback = { kind: "success" | "error"; message: string } | null;

const CONTACT_OPTIONS: ContactMethod[] = ["email", "phone", "chat"];

const EMPTY_FORM: FormState = {
  full_name: "",
  phone: "",
  role: "tenant",
  city: "",
  address: "",
  contact_method: "email",
  dob: "",
  avatar_url: null
};

const inputClasses =
  "w-full rounded-lg border border-brand-outline/60 bg-white px-3 py-2 text-sm text-brand-dark shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400";

const cardClasses = "rounded-3xl border border-brand-outline/60 bg-white shadow-sm";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveBucketName(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalize(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function roleLabel(role: Profile["role"]): string {
  if (role === "admin") return "Admin";
  if (role === "landlord") return "Landlord";
  return "Tenant";
}

function mapInitialForm(profile: ProfileFormInitial | null): FormState {
  if (!profile) return EMPTY_FORM;
  return {
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    role: profile.role ?? "tenant",
    city: profile.city ?? "",
    address: profile.address ?? "",
    contact_method: (profile.contact_method ?? "email") as ContactMethod,
    dob: profile.dob ?? "",
    avatar_url: profile.avatar_url ?? null
  };
}

export default function ProfilePageClient({ initialProfile, initialPrefs, email }: Props) {
  const supabase = createSupabaseBrowserClient();
  const avatarBucket =
    resolveBucketName(clientEnv.NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS) ??
    resolveBucketName(clientEnv.NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS) ??
    "listings";

  const [form, setForm] = useState<FormState>(() => mapInitialForm(initialProfile));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(form.avatar_url);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const hasExistingProfile = Boolean(initialProfile);

  const initialState = useMemo(() => mapInitialForm(initialProfile), [initialProfile]);

  useEffect(() => {
    setForm(initialState);
    setAvatarFile(null);
    setAvatarPreview(initialState.avatar_url);
  }, [initialState]);

  useEffect(() => {
    if (!avatarFile) return;
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(form.avatar_url);
    }
  }, [avatarFile, form.avatar_url]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("theme");
    const shouldUseDark =
      stored === "dark" || (!stored && document.documentElement.classList.contains("dark"));
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  const handleInputChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    if (!isEditing) setIsEditing(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (method: ContactMethod) => {
    handleInputChange("contact_method", method);
  };

  const handleThemeToggle = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        document.documentElement.classList.toggle("dark", next);
        window.localStorage.setItem("theme", next ? "dark" : "light");
      }
      return next;
    });
  };

  async function handleSave() {
    if (!supabase) {
      setFeedback({ kind: "error", message: "Supabase is not configured for this environment." });
      return;
    }

    const parsed = profileUpdateSchema.safeParse({
      full_name: form.full_name,
      email,
      phone: form.phone,
      user_type: form.role === "landlord" ? "landlord" : "tenant",
      city: form.city,
      address: form.address,
      contact_method: form.contact_method,
      dob: form.dob,
      photo: avatarFile ?? undefined
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFeedback({
        kind: "error",
        message: issue?.message ?? "Please review the highlighted fields and try again."
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Not signed in.");

      let avatar_url = form.avatar_url ?? null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const key = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(avatarBucket)
          .upload(key, avatarFile, { upsert: true, contentType: avatarFile.type || "image/*" });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from(avatarBucket).getPublicUrl(key);
        avatar_url = publicUrl?.publicUrl ? `${publicUrl.publicUrl}?t=${Date.now()}` : avatar_url;
      }

      const basePrefs = isPlainRecord(initialPrefs) ? { ...initialPrefs } : {};
      const profileSection = isPlainRecord(basePrefs["profile"]) ? { ...(basePrefs["profile"] as Record<string, unknown>) } : {};

      const nextProfilePrefs = {
        ...profileSection,
        city: normalize(form.city),
        address: normalize(form.address),
        dob: normalize(form.dob),
        contactMethod: form.contact_method
      };

      const cleanedProfilePrefs = Object.fromEntries(
        Object.entries(nextProfilePrefs).filter(([, value]) => value !== null && value !== undefined && value !== "")
      );

      if (Object.keys(cleanedProfilePrefs).length > 0) {
        basePrefs["profile"] = cleanedProfilePrefs;
      } else {
        delete basePrefs["profile"];
      }

      const payload: Record<string, unknown> = {
        full_name: normalize(form.full_name),
        email,
        phone: normalize(form.phone),
        role: form.role,
        avatar_url,
        prefs: basePrefs
      };

      const response = hasExistingProfile
        ? await supabase.from("profiles").update(payload).eq("id", user.id)
        : await supabase.from("profiles").insert({ ...payload, id: user.id });

      if (response.error) throw response.error;

      setForm((prev) => ({ ...prev, avatar_url: avatar_url ?? prev.avatar_url }));
      setAvatarFile(null);
      setIsEditing(false);
      setFeedback({ kind: "success", message: "Profile saved successfully." });
    } catch (error) {
      let message = "Update failed. Please try again.";
      if (error instanceof Error) {
        message = error.message;
      } else if (isPlainRecord(error)) {
        const candidate =
          (typeof error["message"] === "string" && error["message"]) ||
          (typeof error["error_description"] === "string" && error["error_description"]) ||
          (typeof error["details"] === "string" && error["details"]);
        if (candidate) message = candidate;
      }

      if (/row-level security/i.test(message)) {
        message =
          "Avatar upload was blocked by Supabase storage policies. Ensure authenticated users can manage their own folder in the selected bucket.";
      }

      setFeedback({ kind: "error", message });
    } finally {
      setIsSaving(false);
    }
  }

  const handleCancel = () => {
    setForm(initialState);
    setAvatarFile(null);
    setAvatarPreview(initialState.avatar_url);
    setIsEditing(false);
    setFeedback(null);
  };

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className={clsx(cardClasses, "overflow-hidden")}>
        <div className="relative h-36 w-full overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primaryStrong">
          <button
            type="button"
            onClick={handleThemeToggle}
            className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-brand-dark shadow-sm transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-pressed={isDarkMode}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {isDarkMode ? "Dark mode on" : "Dark mode off"}
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-white bg-brand-light shadow-lg">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={form.full_name || "Profile avatar"}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-brand-primary">
                      {(form.full_name || email).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 inline-flex cursor-pointer items-center gap-1 rounded-full border border-brand-outline/60 bg-white px-3 py-1 text-xs font-medium text-brand-dark shadow-sm transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <input
                    id="avatar-upload"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (!file) return;
                      setAvatarFile(file);
                      setIsEditing(true);
                      event.target.value = "";
                    }}
                  />
                  Upload avatar
                </label>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-brand-dark">
                  {form.full_name?.trim() || "Complete your profile"}
                </h1>
                <p className="text-sm text-neutral-500">{email}</p>
                <span className="inline-flex items-center rounded-full bg-brand-primaryMuted px-3 py-1 text-xs font-medium text-brand-primary">
                  {roleLabel(form.role)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing((prev) => !prev);
                  setFeedback(null);
                }}
                className={clsx(buttonStyles({ variant: "secondary", size: "sm" }), "gap-2")}
              >
                {isEditing ? "Stop editing" : "Edit profile"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
          className={clsx(
            "rounded-3xl border px-4 py-3 text-sm font-medium",
            feedback.kind === "success"
              ? "border-brand-success bg-brand-successMuted text-brand-success"
              : "border-danger bg-danger-muted text-danger"
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className={cardClasses}>
        <header className="border-b border-brand-outline/40 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-dark">Profile summary</h2>
          <p className="text-sm text-neutral-500">
            Quick snapshot of your public information.
          </p>
        </header>
        <dl className="grid gap-4 px-6 py-4 sm:grid-cols-2">
          <SummaryItem label="Email" value={email} />
          <SummaryItem label="Phone" value={form.phone} />
          <SummaryItem label="City" value={form.city} />
          <SummaryItem
            label="Preferred contact"
            value={
              form.contact_method
                ? form.contact_method.charAt(0).toUpperCase() + form.contact_method.slice(1)
                : "Email"
            }
          />
        </dl>
      </section>

      <section className={cardClasses}>
        <header className="border-b border-brand-outline/40 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-dark">Contact preferences</h2>
          <p id="profile-contact-help" className="text-sm text-neutral-500">
            Choose how you prefer to communicate with other Rento members.
          </p>
        </header>
        <div
          className="flex flex-wrap gap-3 px-6 py-4"
          role="radiogroup"
          aria-label="Preferred contact method"
          aria-describedby="profile-contact-help"
        >
          {CONTACT_OPTIONS.map((method) => {
            const isActive = form.contact_method === method;
            const methodLabel = method.charAt(0).toUpperCase() + method.slice(1);
            return (
              <button
                key={method}
                type="button"
                onClick={() => (isEditing ? handleContactChange(method) : undefined)}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  isActive
                    ? "bg-brand-primary text-white shadow-sm"
                    : "border border-brand-outline/60 bg-white text-brand-dark hover:border-brand-primary hover:text-brand-primary",
                  !isEditing && "cursor-not-allowed opacity-60"
                )}
                disabled={!isEditing}
                role="radio"
                aria-checked={isActive}
                aria-label={methodLabel}
                tabIndex={isEditing ? 0 : -1}
              >
                {methodLabel}
              </button>
            );
          })}
        </div>
      </section>

      <section className={cardClasses}>
        <header className="border-b border-brand-outline/40 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-dark">Personal details</h2>
          <p className="text-sm text-neutral-500">
            These details help us personalize your experience across Rento.
          </p>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!isEditing) return;
            void handleSave();
          }}
          className="space-y-6 px-6 py-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Full name"
              id="full_name"
              value={form.full_name}
              onChange={(event) => handleInputChange("full_name", event.currentTarget.value)}
              disabled={!isEditing}
            />
            <Field label="Email" id="email" value={email} disabled />
            <Field
              label="Phone"
              id="phone"
              value={form.phone}
              onChange={(event) => handleInputChange("phone", event.currentTarget.value)}
              disabled={!isEditing}
            />
            <Field
              label="Address"
              id="address"
              value={form.address}
              onChange={(event) => handleInputChange("address", event.currentTarget.value)}
              disabled={!isEditing}
            />
            <Field
              label="City"
              id="city"
              value={form.city}
              onChange={(event) => handleInputChange("city", event.currentTarget.value)}
              disabled={!isEditing}
            />
            <Field
              label="Date of birth"
              id="dob"
              type="date"
              value={form.dob}
              onChange={(event) => handleInputChange("dob", event.currentTarget.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!isEditing || isSaving}
              className={clsx(buttonStyles({ variant: "primary", size: "md" }), "gap-2")}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              disabled={!isEditing || isSaving}
              onClick={handleCancel}
              className={clsx(buttonStyles({ variant: "secondary", size: "md" }), "gap-2")}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type FieldProps = {
  label: string;
  id: string;
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: React.HTMLInputTypeAttribute;
};

function Field({ label, id, value, onChange, disabled, type = "text" }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark" htmlFor={id}>
      {label}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={inputClasses}
      />
    </label>
  );
}

type SummaryItemProps = {
  label: string;
  value?: string | null;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm text-brand-dark">{value?.trim() ? value : "Not provided"}</dd>
    </div>
  );
}
