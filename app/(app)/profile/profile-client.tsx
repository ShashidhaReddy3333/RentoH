"use client";

import { useState } from "react";
import Image from "next/image";

import { profileUpdateSchema } from "@/lib/schemas/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/profile";

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

const EMPTY_PROFILE: ProfileFormInitial = {
  full_name: null,
  phone: null,
  role: "tenant",
  city: null,
  address: null,
  contact_method: null,
  dob: null,
  avatar_url: null
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function ProfileForm({ initialProfile, initialPrefs, email }: Props) {
  const profile = initialProfile ?? EMPTY_PROFILE;
  const supabase = createSupabaseBrowserClient();

  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const normalize = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    if (!supabase) {
      setMsg("Supabase not configured.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const parsed = profileUpdateSchema.safeParse({
      ...Object.fromEntries(fd.entries()),
      photo: fd.get("photo")
    });

    if (!parsed.success) {
      setMsg(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    const data = parsed.data;

    setPending(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Not signed in");

      let avatar_url = profile.avatar_url ?? null;
      const fileEntry = fd.get("photo");
      const file = fileEntry instanceof File ? fileEntry : null;
      if (file && file.size > 0) {
        const ext = file.name.split(".").pop() || "jpg";
        const key = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profiles-avatars")
          .upload(key, file, { upsert: true, contentType: file.type || "image/*" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("profiles-avatars").getPublicUrl(key);
        avatar_url = pub?.publicUrl ?? null;
      }

      const basePrefs = isPlainRecord(initialPrefs) ? { ...initialPrefs } : {};
      const profileSectionRaw = basePrefs["profile"];
      const profilePrefs = isPlainRecord(profileSectionRaw) ? { ...profileSectionRaw } : {};

      const assignProfileField = (key: string, value: string | null) => {
        if (value === null) {
          delete profilePrefs[key];
        } else {
          profilePrefs[key] = value;
        }
      };

      assignProfileField("city", normalize(data.city ?? null));
      assignProfileField("address", normalize(data.address ?? null));
      assignProfileField("dob", normalize(data.dob ?? null));
      assignProfileField("contactMethod", data.contact_method ?? null);

      if (Object.keys(profilePrefs).length > 0) {
        basePrefs["profile"] = profilePrefs;
      } else {
        delete basePrefs["profile"];
      }

      const requestedRole = data.user_type ?? profile.role ?? "tenant";
      const role = profile.role === "admin" ? "admin" : requestedRole;

      const payload: Record<string, unknown> = {
        full_name: normalize(data.full_name ?? null),
        email: data.email ?? email,
        phone: normalize(data.phone ?? null),
        role,
        avatar_url,
        prefs: basePrefs
      };

      const hasExistingProfile = Boolean(initialProfile);
      const response = hasExistingProfile
        ? await supabase.from("profiles").update(payload).eq("id", user.id)
        : await supabase.from("profiles").insert({ ...payload, id: user.id });

      if (response.error) {
        throw response.error;
      }

      setMsg("Profile updated");
    } catch (err) {
      let message = "Update failed";
      if (err instanceof Error) {
        message = err.message;
      } else if (isPlainRecord(err)) {
        const candidate =
          (typeof err["message"] === "string" && err["message"]) ||
          (typeof err["error_description"] === "string" && err["error_description"]) ||
          (typeof err["details"] === "string" && err["details"]);
        if (candidate) {
          message = candidate;
        }
      }
      setMsg(message);
    } finally {
      setPending(false);
    }
  }

  const roleIsAdmin = profile.role === "admin";
  const selectableRole = profile.role === "landlord" ? "landlord" : "tenant";
  const contactMethod = profile.contact_method ?? "email";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-black/10 bg-white p-6 shadow-soft">
      {msg && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="full_name">
            Full Name
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name ?? ""}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input value={email} readOnly className="mt-1 w-full cursor-not-allowed rounded-lg border bg-gray-50 p-2" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={profile.phone ?? ""}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="user_type">
            User Type
          </label>
          {roleIsAdmin ? (
            <input
              value="Admin"
              readOnly
              className="mt-1 w-full cursor-not-allowed rounded-lg border bg-gray-50 p-2"
            />
          ) : (
            <select
              id="user_type"
              name="user_type"
              defaultValue={selectableRole}
              className="mt-1 w-full rounded-lg border p-2"
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
          )}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="city">
            City
          </label>
          <input id="city" name="city" defaultValue={profile.city ?? ""} className="mt-1 w-full rounded-lg border p-2" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="address">
            Address
          </label>
          <input
            id="address"
            name="address"
            defaultValue={profile.address ?? ""}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </div>
        <div className="md:col-span-2">
          <span className="text-sm font-medium">Preferred Contact</span>
          <div className="mt-1 flex gap-4">
            {["email", "phone", "chat"].map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="contact_method" value={v} defaultChecked={contactMethod === v} />
                {(v?.[0]?.toUpperCase() ?? "") + v.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="dob">
            Date of Birth
          </label>
          <input
            id="dob"
            name="dob"
            type="date"
            defaultValue={profile.dob ?? ""}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="photo">
            Profile Photo
          </label>
          <input id="photo" name="photo" type="file" accept="image/*" className="mt-1 w-full rounded-lg border p-2" />
          {profile.avatar_url && (
            <div className="mt-2 h-20 w-20 overflow-hidden rounded-full">
              <Image src={profile.avatar_url} alt="Avatar" width={80} height={80} className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <button disabled={pending} className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
