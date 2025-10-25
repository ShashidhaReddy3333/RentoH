"use client";

import Image from "next/image";
import React, { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UploadedImage = {
  key: string; // storage path
  url: string; // public url (or signed)
  isCover?: boolean;
  uploading?: boolean;
};

export default function ListingImageUploader({ name = "images" }: { name?: string }) {
  const [images, setImages] = useState<UploadedImage[]>([]);

  const supabase = createSupabaseBrowserClient();

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!supabase) {
        console.warn("[uploader] Supabase client unavailable");
        return;
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const path = `listings/${id}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

        // optimistic UI entry
        const temp: UploadedImage = { key: path, url: "", uploading: true };
        setImages((s) => [...s, temp]);

        try {
          const bucketName =
            process.env["NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS"] ||
            process.env["SUPABASE_STORAGE_BUCKET_LISTINGS"] ||
            "listing-media";
          const res = await supabase.storage.from(bucketName).upload(path, file, { upsert: false });
          if (res.error) throw res.error;

          const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
          const url = data?.publicUrl ?? "";

          setImages((s) => s.map((it) => (it.key === path ? { ...it, url, uploading: false } : it)));
        } catch (err) {
          console.error("[uploader] upload failed", err);
          setImages((s) => s.filter((it) => it.key !== path));
        }
      });

      await Promise.all(uploadPromises);
    },
    [supabase]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.currentTarget.value = "";
  };

  const removeImage = (key: string) => {
    setImages((s) => s.filter((i) => i.key !== key));
  };

  const move = (from: number, to: number) => {
    setImages((s) => {
      const copy = [...s];
      if (from < 0 || from >= copy.length || to < 0 || to > copy.length) return s;
      const [item] = copy.splice(from, 1);
      if (!item) return s;
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const setCover = (key: string) => {
    setImages((s) => s.map((i) => ({ ...i, isCover: i.key === key })));
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-lg border border-dashed p-4 text-center"
      >
        <p className="text-sm text-text-muted">Drag & drop images here or</p>
        <label className="mt-2 inline-block cursor-pointer rounded-md bg-brand-teal px-4 py-2 text-sm text-white">
          <input type="file" accept="image/*" multiple onChange={onFileChange} className="sr-only" />
          Upload images
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {images.map((img, idx) => (
          <div key={img.key} className="relative rounded-lg border p-2">
            {img.uploading ? (
              <div className="flex h-40 items-center justify-center">Uploading...</div>
            ) : (
              <Image
                src={img.url}
                alt={`listing-${idx}`}
                className="h-40 w-full object-cover"
                width={200} // Provide appropriate width
                height={160} // Provide appropriate height
              />
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button type="button" className="text-xs" onClick={() => setCover(img.key)}>
                  {img.isCover ? "Cover" : "Set cover"}
                </button>
                <button type="button" className="text-xs" onClick={() => removeImage(img.key)}>
                  Remove
                </button>
              </div>
              <div className="flex gap-1">
                <button type="button" disabled={idx === 0} onClick={() => move(idx, idx - 1)} className="text-xs">
                  ←
                </button>
                <button type="button" disabled={idx === images.length - 1} onClick={() => move(idx, idx + 1)} className="text-xs">
                  →
                </button>
              </div>
            </div>

            {/* Hidden inputs so the parent form receives the image keys and cover info */}
            <input type="hidden" name={`${name}[]`} value={img.key} />
            {img.isCover ? <input type="hidden" name="cover" value={img.key} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
