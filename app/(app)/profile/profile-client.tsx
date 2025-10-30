"use client";

import { useState } from "react";
import Image from "next/image";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { profileUpdateSchema } from "@/lib/schemas/profile";
import type { Profile } from "@/lib/types/profile";

export default function ProfileForm({
  initialProfile,
  email
}: {
  initialProfile: Profile | null;
  email: string;
}) {
  const supabase = createSupabaseBrowserClient();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

    const normalize = (value?: string | null) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };

    setPending(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Not signed in");

      let avatar_url = initialProfile?.avatar_url ?? null;
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

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: data.full_name,
          email: data.email ?? email,
          phone: data.phone,
          user_type: data.user_type,
          city: normalize(data.city ?? null),
          address: normalize(data.address ?? null),
          contact_method: data.contact_method ?? null,
          dob: normalize(data.dob ?? null),
          avatar_url
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      setMsg("Profile updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setMsg(message);
    } finally {
      setPending(false);
    }
  }

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
            defaultValue={initialProfile?.full_name ?? ""}
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
            defaultValue={initialProfile?.phone ?? ""}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="user_type">
            User Type
          </label>
          <select
            id="user_type"
            name="user_type"
            defaultValue={initialProfile?.user_type ?? "tenant"}
            className="mt-1 w-full rounded-lg border p-2"
          >
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="city">
            City
          </label>
          <input
            id="city"
            name="city"
            defaultValue={initialProfile?.city ?? ""}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="address">
            Address
          </label>
          <input
            id="address"
            name="address"
            defaultValue={initialProfile?.address ?? ""}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </div>
        <div className="md:col-span-2">
          <span className="text-sm font-medium">Preferred Contact</span>
          <div className="mt-1 flex gap-4">
            {["email", "phone", "chat"].map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="contact_method"
                  value={v}
                  defaultChecked={
                    initialProfile?.contact_method === v || (!initialProfile?.contact_method && v === "email")
                  }
                />
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
            defaultValue={initialProfile?.dob ?? ""}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="photo">
            Profile Photo
          </label>
          <input id="photo" name="photo" type="file" accept="image/*" className="mt-1 w-full rounded-lg border p-2" />
          {initialProfile?.avatar_url && (
            <div className="mt-2 h-20 w-20 overflow-hidden rounded-full">
              <Image
                src={initialProfile.avatar_url}
                alt="Avatar"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
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
