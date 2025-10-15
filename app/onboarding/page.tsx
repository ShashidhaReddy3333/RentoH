"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import Checkbox from "@/components/form/checkbox";
import Field from "@/components/form/field";
import Toggle from "@/components/form/toggle";
import { propertyTypes } from "@/components/providers/app-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Role = "tenant" | "landlord";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("tenant");
  const [tenantPrefs, setTenantPrefs] = useState({
    city: "",
    rent: 2000,
    type: "apartment",
    furnished: true
  });
  const [landlordDraft, setLandlordDraft] = useState({
    title: "",
    address: "",
    city: "",
    postalCode: ""
  });
  const [documents, setDocuments] = useState({ avatar: "", idProvided: false });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    router.push(role === "tenant" ? "/browse" : "/dashboard");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 text-textc">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-textc">Complete your profile</h1>
        <p className="text-sm text-textc/70">
          Choose your path and share a few details so we can tailor Rento Bridge to your goals.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-textc">I am a...</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {roleOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setRole(option.key)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      role === option.key
                        ? "border-brand.primary bg-brand.primary/10 text-brand.primary"
                        : "border-black/10 text-textc/80 hover:border-brand.primary dark:border-white/20"
                    }`}
                    aria-pressed={role === option.key}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <p className="text-xs text-textc/60">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {role === "tenant" ? (
              <TenantSection prefs={tenantPrefs} onChange={setTenantPrefs} />
            ) : (
              <LandlordSection draft={landlordDraft} onChange={setLandlordDraft} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold text-textc">Verification (optional)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="profile-photo" label="Profile photo">
                <input
                  id="profile-photo"
                  type="file"
                  className="input"
                  accept="image/*"
                  onChange={(event) => {
                    const fileName = event.target.files?.[0]?.name ?? "";
                    setDocuments((prev) => ({ ...prev, avatar: fileName }));
                  }}
                />
              </Field>
              <div className="flex flex-col justify-end gap-2">
                <Checkbox
                  id="government-id"
                  label="I am uploading a government-issued ID"
                  checked={documents.idProvided}
                  onChange={(checked) =>
                    setDocuments((prev) => ({ ...prev, idProvided: checked }))
                  }
                />
                {documents.avatar ? (
                  <p className="text-xs text-textc/60">Uploaded: {documents.avatar}</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <button type="submit" className={`${buttonStyles({ variant: "primary", size: "lg" })} w-full md:w-auto`}>
          Continue
        </button>
      </form>
    </div>
  );
}

function TenantSection({
  prefs,
  onChange
}: {
  prefs: { city: string; rent: number; type: string; furnished: boolean };
  onChange: (next: { city: string; rent: number; type: string; furnished: boolean }) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field id="tenant-city" label="Preferred city" required>
        <select
          id="tenant-city"
          className="input"
          value={prefs.city}
          onChange={(event) => onChange({ ...prefs, city: event.target.value })}
        >
          <option value="">Select city</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </Field>
      <Field id="tenant-type" label="Property type">
        <select
          id="tenant-type"
          className="input"
          value={prefs.type}
          onChange={(event) => onChange({ ...prefs, type: event.target.value })}
        >
          {propertyTypes().map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </Field>
      <div className="col-span-2">
        <label htmlFor="rent-range" className="text-sm font-medium text-textc">
          Monthly rent budget: ${prefs.rent}
        </label>
        <input
          id="rent-range"
          type="range"
          min={800}
          max={4000}
          step={50}
          value={prefs.rent}
          onChange={(event) => onChange({ ...prefs, rent: Number(event.target.value) })}
          className="w-full accent-brand.primary"
        />
      </div>
      <Toggle
        id="furnished-toggle"
        checked={prefs.furnished}
        onChange={(next) => onChange({ ...prefs, furnished: next })}
        label={prefs.furnished ? "Furnished preferred" : "Unfurnished preferred"}
      />
    </div>
  );
}

function LandlordSection({
  draft,
  onChange
}: {
  draft: { title: string; address: string; city: string; postalCode: string };
  onChange: (next: { title: string; address: string; city: string; postalCode: string }) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field id="listing-title" label="Property title" required>
        <input
          id="listing-title"
          className="input"
          placeholder="Bright downtown condo"
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          required
        />
      </Field>
      <Field id="listing-address" label="Street address" required>
        <input
          id="listing-address"
          className="input"
          placeholder="123 King Street W"
          value={draft.address}
          onChange={(event) => onChange({ ...draft, address: event.target.value })}
          required
        />
      </Field>
      <Field id="listing-city" label="City" required>
        <input
          id="listing-city"
          className="input"
          placeholder="Waterloo"
          value={draft.city}
          onChange={(event) => onChange({ ...draft, city: event.target.value })}
          required
        />
      </Field>
      <Field id="listing-postal" label="Postal code" required>
        <input
          id="listing-postal"
          className="input"
          placeholder="N2L 3G1"
          value={draft.postalCode}
          onChange={(event) => onChange({ ...draft, postalCode: event.target.value })}
          required
        />
      </Field>
    </div>
  );
}

const roleOptions = [
  {
    key: "tenant" as Role,
    label: "Tenant",
    description: "Tell us what you are looking for and save listings to revisit later."
  },
  {
    key: "landlord" as Role,
    label: "Landlord",
    description: "Create listings, respond to inquiries, and manage verifications."
  }
];

const cities = ["Waterloo", "Kitchener", "Cambridge", "Guelph", "Toronto"];
