"use client";

import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";

type AvatarUploaderProps = {
  value?: string;
  onChange: (value?: string) => void;
};

export default function AvatarUploader({ value, onChange }: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(value);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onChange(undefined);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : undefined;
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-teal/10 text-lg font-semibold text-brand-teal">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Avatar preview" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          "Upload"
        )}
      </div>
      <div className="grid gap-2 text-sm text-text-muted">
        <label
          className={buttonStyles({ variant: "outline", size: "sm" })}
        >
          <span>Change avatar</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="sr-only"
            data-testid="avatar-input"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setPreview(undefined);
            onChange(undefined);
          }}
          className="text-xs font-semibold text-brand-blue transition hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
