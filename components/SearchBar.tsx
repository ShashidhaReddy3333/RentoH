"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";

type SearchFormState = {
  location: string;
  min: string;
  max: string;
  beds: string;
};

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState<SearchFormState>({
    location: "",
    min: "",
    max: "",
    beds: ""
  });

  useEffect(() => {
    setForm({
      location: params.get("city") ?? "",
      min: params.get("min") ?? "",
      max: params.get("max") ?? "",
      beds: params.get("beds") ?? ""
    });
  }, [params]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams();

    if (form.location) query.set("city", form.location);
    if (form.min) query.set("min", form.min);
    if (form.max) query.set("max", form.max);
    if (form.beds) query.set("beds", form.beds);

    router.push(`/browse?${query.toString()}`);
  };

  const handleChange = (field: keyof SearchFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-3xl border border-black/5 bg-white p-4 shadow-soft sm:p-6"
      data-testid="search-bar"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,140px))_auto] sm:items-end sm:gap-3">
        <Field label="Location" htmlFor="search-location">
          <input
            id="search-location"
            value={form.location}
            onChange={handleChange("location")}
            placeholder="Neighbourhood or city"
            className="input"
            data-testid="search-location"
          />
        </Field>
        <Field label="Min price" htmlFor="search-min">
          <input
            id="search-min"
            value={form.min}
            onChange={handleChange("min")}
            placeholder="1,800"
            inputMode="numeric"
            className="input"
            data-testid="search-min"
          />
        </Field>
        <Field label="Max price" htmlFor="search-max">
          <input
            id="search-max"
            value={form.max}
            onChange={handleChange("max")}
            placeholder="2,800"
            inputMode="numeric"
            className="input"
            data-testid="search-max"
          />
        </Field>
        <Field label="Beds" htmlFor="search-beds">
          <input
            id="search-beds"
            value={form.beds}
            onChange={handleChange("beds")}
            placeholder="2+"
            inputMode="numeric"
            className="input"
            data-testid="search-beds"
          />
        </Field>
        <button
          type="submit"
          className={buttonStyles({ variant: "primary", size: "md" })}
          data-testid="search-submit"
        >
          Search homes
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  htmlFor
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-text-muted" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}
