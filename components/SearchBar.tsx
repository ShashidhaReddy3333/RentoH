"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import Field from "@/components/form/field";
import { useRef } from "react";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refs = {
    location: useRef<HTMLInputElement | null>(null),
    min: useRef<HTMLInputElement | null>(null),
    max: useRef<HTMLInputElement | null>(null),
    beds: useRef<HTMLInputElement | null>(null)
  };

  useEffect(() => {
    setForm({
      location: params?.get("city") ?? "",
      min: params?.get("min") ?? "",
      max: params?.get("max") ?? "",
      beds: params?.get("beds") ?? ""
    });
  }, [params]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const numRe = /^\d{1,}$/;
    if (form["min"] && !numRe.test(form["min"].replace(/,/g, "")))
      nextErrors["min"] = "Minimum price must be a whole number.";
    if (form["max"] && !numRe.test(form["max"].replace(/,/g, "")))
      nextErrors["max"] = "Maximum price must be a whole number.";
    if (form["beds"] && !numRe.test(form["beds"].replace(/\+$/, "")))
      nextErrors["beds"] = "Beds must be entered as a whole number (add + for or more).";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      // autofocus first invalid
      const firstKey = Object.keys(nextErrors)[0] as keyof typeof refs;
      const el = refs[firstKey]?.current;
      if (el) {
        el.focus();
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      return;
    }

    const query = new URLSearchParams();
    if (form.location) query.set("city", form.location);
    if (form.min) query.set("min", form.min);
    if (form.max) query.set("max", form.max);
    if (form.beds) query.set("beds", form.beds);
    setErrors({});
    router.push(`/browse?${query.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-3xl border border-black/5 bg-white p-4 shadow-soft sm:p-6"
      data-testid="search-bar"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,140px))_auto] sm:items-end sm:gap-3">
        <Field id="search-location" label="Location" hint="Search by neighbourhood or city">
          <input
            ref={refs.location}
            id="search-location"
            value={form.location}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, location: e.target.value }));
              if (errors["location"]) setErrors((prev) => {
                const c = { ...prev };
                delete c["location"];
                return c;
              });
            }}
            placeholder="Neighbourhood or city"
            className="input"
            data-testid="search-location"
          />
        </Field>
  <Field id="search-min" label="Min price" hint="Optional" error={errors["min"]}>
          <input
            ref={refs.min}
            id="search-min"
            value={form.min}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, min: e.target.value }));
              if (errors["min"]) setErrors((prev) => { const c = { ...prev }; delete c["min"]; return c; });
            }}
            placeholder="1,800"
            inputMode="numeric"
            className="input"
            data-testid="search-min"
          />
        </Field>
  <Field id="search-max" label="Max price" hint="Optional" error={errors["max"]}>
          <input
            ref={refs.max}
            id="search-max"
            value={form.max}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, max: e.target.value }));
              if (errors["max"]) setErrors((prev) => { const c = { ...prev }; delete c["max"]; return c; });
            }}
            placeholder="2,800"
            inputMode="numeric"
            className="input"
            data-testid="search-max"
          />
        </Field>
  <Field id="search-beds" label="Beds" hint="Optional" error={errors["beds"]}>
          <input
            ref={refs.beds}
            id="search-beds"
            value={form.beds}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, beds: e.target.value }));
              if (errors["beds"]) setErrors((prev) => { const c = { ...prev }; delete c["beds"]; return c; });
            }}
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
