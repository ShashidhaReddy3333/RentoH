"use client";

import { useState, useMemo } from "react";
import { signUpSchema, type SignUpInput } from "@/lib/schemas/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function PasswordMeter({ value }: { value: string }) {
  const score = useMemo(() => {
    let s = 0;
    if (/[A-Z]/.test(value)) s++;
    if (/[a-z]/.test(value)) s++;
    if (/[0-9]/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    if (value.length >= 12) s++;
    return s; // 0-5
  }, [value]);
  return (
    <div className="mt-1 h-1.5 w-full rounded bg-black/10">
      <div className="h-full rounded bg-emerald-500 transition-all" style={{ width: `${(score / 5) * 100}%` }} />
    </div>
  );
}

export default function SignUpClient() {
  const supabase = createSupabaseBrowserClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const formEntries = Object.fromEntries(fd.entries());
    const rawUserType = fd.get("user_type");
    const normalizedUserType =
      typeof rawUserType === "string" ? rawUserType.toLowerCase() : rawUserType;

    const parsed = signUpSchema.safeParse({
      ...formEntries,
      user_type: normalizedUserType,
      photo: fd.get("photo")
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    if (!supabase) {
      setError("Supabase not configured.");
      return;
    }

    const data = parsed.data as SignUpInput;
    setPending(true);

    try {
      const { data: signRes, error: signErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            user_type: data.user_type,
            phone: data.phone,
            city: data.city ?? null,
            address: data.address ?? null,
            contact_method: data.contact_method ?? null,
            dob: data.dob ?? null
          }
        }
      });
      if (signErr) throw signErr;
      let { user, session } = signRes;

      if (!session) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });
        if (signInErr) {
          if (signInErr.message?.toLowerCase().includes("email not confirmed")) {
            setError("Check your email to confirm your account, then sign in to finish setting up your profile.");
            return;
          }
          throw signInErr;
        }
        session = signInData.session;
        user = signInData.user;
      }

      if (!user || !session) {
        throw new Error("Unable to establish a Supabase session.");
      }

      let photo_url: string | undefined;
      const fileEntry = fd.get("photo");
      const file = fileEntry instanceof File ? fileEntry : null;
      if (file && file.size > 0) {
        const idPrefix = user.id;
        const ext = file.name.split(".").pop() || "jpg";
        const key = `${idPrefix}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage.from("profiles-avatars").upload(key, file, {
          upsert: true,
          contentType: file.type || "image/*"
        });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from("profiles-avatars").getPublicUrl(key);
        photo_url = pub?.publicUrl;
      }

      const { error: profErr } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        user_type: data.user_type,
        city: data.city ?? null,
        address: data.address ?? null,
        contact_method: data.contact_method ?? null,
        dob: data.dob ?? null,
        photo_url: photo_url ?? null
      });
      if (profErr) throw profErr;

      window.location.href = "/profile?toast=welcome";
    } catch (err) {
      console.error("[sign-up]", err);
      let message = "Sign up failed";
      if (err instanceof Error && err.message) {
        message = err.message;
      } else if (err && typeof err === "object") {
        const withMessage = err as { message?: unknown; error_description?: unknown; error?: unknown };
        const candidate =
          withMessage.message ??
          withMessage.error_description ??
          withMessage.error ??
          (typeof err === "string" ? err : null);
        if (typeof candidate === "string" && candidate.trim().length > 0) {
          message = candidate;
        }
      } else if (typeof err === "string" && err.trim().length > 0) {
        message = err;
      }
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-4 rounded-2xl border border-black/10 bg-white p-6 shadow-soft"
    >
      <h1 className="text-2xl font-semibold">Create your account</h1>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="full_name">
            Full Name
          </label>
          <input id="full_name" name="full_name" required className="mt-1 w-full rounded-lg border p-2" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="mt-1 w-full rounded-lg border p-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-lg border p-2"
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordMeter value={password} />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" required className="mt-1 w-full rounded-lg border p-2" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="user_type">
            User Type
          </label>
          <select id="user_type" name="user_type" required className="mt-1 w-full rounded-lg border p-2">
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="city">
            City
          </label>
          <input id="city" name="city" className="mt-1 w-full rounded-lg border p-2" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="address">
            Current Address
          </label>
          <input id="address" name="address" className="mt-1 w-full rounded-lg border p-2" />
        </div>

        <div className="md:col-span-2">
          <span className="text-sm font-medium">Preferred Contact</span>
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="contact_method" value="email" defaultChecked /> Email
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="contact_method" value="phone" /> Phone
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="contact_method" value="chat" /> In-App Chat
            </label>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="dob">
            Date of Birth
          </label>
          <input id="dob" name="dob" type="date" className="mt-1 w-full rounded-lg border p-2" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="photo">
            Profile Photo
          </label>
          <input id="photo" name="photo" type="file" accept="image/*" className="mt-1 w-full rounded-lg border p-2" />
        </div>
      </div>

      <button disabled={pending} className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
