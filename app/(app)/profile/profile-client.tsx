"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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

  const handleInputChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    if (!isEditing) setIsEditing(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (method: ContactMethod) => {
    handleInputChange("contact_method", method);
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
        avatar_url = publicUrl?.publicUrl ?? avatar_url;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12 text-slate-50">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl bg-white/5 p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.8)] backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="h-36 w-36 overflow-hidden rounded-full border border-white/10 bg-slate-900/60 shadow-inner">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={form.full_name || "Profile avatar"}
                    width={144}
                    height={144}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-slate-500">
                    {(form.full_name || email).slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-blue-500 text-white shadow-xl transition hover:scale-105 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
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
                <span className="sr-only">Upload profile photo</span>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M12.586 3.414a2 2 0 0 1 2.828 2.828l-8.95 8.95a2 2 0 0 1-.878.512l-2.83.78.78-2.83a2 2 0 0 1 .512-.878l8.95-8.95Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m11 4 3 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </label>
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">{form.full_name || "Your Name"}</h1>
            <p className="mt-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.25em] text-slate-200">
              {roleLabel(form.role)}
            </p>

            <button
              type="button"
              onClick={() => {
                setIsEditing((prev) => !prev);
                setFeedback(null);
              }}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-400 via-teal-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition duration-150 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
            >
              {isEditing ? "Stop editing" : "Edit profile"}
            </button>

            <dl className="mt-8 w-full space-y-4 text-left text-sm text-slate-300">
              <SummaryItem label="Email" value={email} />
              <SummaryItem label="Phone" value={form.phone} />
              <SummaryItem label="City" value={form.city} />
            </dl>
          </div>
        </aside>

        <section className="rounded-2xl bg-white/5 p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.8)] backdrop-blur-xl">
          <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Account details</h2>
              <p className="text-sm text-slate-300">Keep your contact information up to date so landlords and tenants can reach you.</p>
            </div>
            {feedback && (
              <span
                className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold tracking-wide ${
                  feedback.kind === "success"
                    ? "bg-teal-400/10 text-teal-300"
                    : "bg-rose-400/10 text-rose-300"
                }`}
              >
                {feedback.message}
              </span>
            )}
          </header>

          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isEditing) return;
              void handleSave();
            }}
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

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-200">Preferred contact</legend>
              <div className="flex flex-wrap gap-3">
                {CONTACT_OPTIONS.map((method) => {
                  const isActive = form.contact_method === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => (isEditing ? handleContactChange(method) : undefined)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
                        isActive
                          ? "bg-gradient-to-r from-teal-400 to-blue-500 text-white shadow-lg"
                          : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/30"
                      } ${isEditing ? "" : "cursor-not-allowed opacity-60"}`}
                      disabled={!isEditing}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={!isEditing || isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-400 via-teal-500 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                disabled={!isEditing || isSaving}
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
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
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-200" htmlFor={id}>
      {label}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/60 disabled:cursor-not-allowed disabled:opacity-60"
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
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-200">{value?.trim() ? value : "Not provided"}</dd>
    </div>
  );
}
