"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UploadedImage = {
  key: string;
  url: string;
  previewUrl?: string;
  isCover?: boolean;
  uploading: boolean;
};

const reorderButtonClass =
  "flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-xs text-text-muted transition hover:bg-brand-teal/10 hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal disabled:opacity-40";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function uniqueId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

type ListingImageUploaderProps = {
  name?: string;
  initialImages?: Array<{ key: string; url: string; isCover?: boolean }>;
};

export default function ListingImageUploader({ name = "images", initialImages = [] }: ListingImageUploaderProps) {
  const supabase = createSupabaseBrowserClient();
  const bucketName = clientEnv.NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS ?? "listings";

  const [images, setImages] = useState<UploadedImage[]>(() =>
    initialImages.map((image) => ({
      key: image.key,
      url: image.url,
      isCover: Boolean(image.isCover),
      uploading: false
    }))
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setImages(
      initialImages.map((image) => ({
        key: image.key,
        url: image.url,
        isCover: Boolean(image.isCover),
        uploading: false
      }))
    );
  }, [initialImages]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  const updateImage = useCallback((key: string, updater: (current: UploadedImage) => UploadedImage | null) => {
    setImages((prev) => {
      const next: UploadedImage[] = [];
      for (const image of prev) {
        if (image.key !== key) {
          next.push(image);
          continue;
        }
        const updated = updater(image);
        if (!updated) {
          if (image.previewUrl) {
            URL.revokeObjectURL(image.previewUrl);
          }
          continue;
        }
        if (image.previewUrl && image.previewUrl !== updated.previewUrl && !updated.previewUrl) {
          URL.revokeObjectURL(image.previewUrl);
        }
        next.push(updated);
      }
      return next;
    });
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setError(null);

      if (!supabase) {
        setError("Supabase is not configured. Image uploads are disabled.");
        return;
      }

      const { data: userResult, error: userError } = await supabase.auth.getUser();
      const user = userResult?.user;
      if (userError || !user) {
        setError("You need to be signed in as a landlord to upload listing photos.");
        return;
      }

      const uploads = Array.from(files).map(async (file) => {
        const key = `${user.id}/${uniqueId()}-${sanitizeFilename(file.name)}`;
        const previewUrl = URL.createObjectURL(file);

        setImages((prev) => [
          ...prev,
          {
            key,
            url: previewUrl,
            previewUrl,
            uploading: true
          }
        ]);

        try {
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(key, file, {
              cacheControl: "3600",
              upsert: false
            });
          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(key);
          const publicUrl = publicData?.publicUrl ?? "";

          updateImage(key, (image) => ({
            ...image,
            url: publicUrl,
            previewUrl: undefined,
            uploading: false
          }));
        } catch (uploadErr) {
          console.error("[listings] Failed to upload image", uploadErr);
          setError("Failed to upload one of the images. Please try again.");
          setImages((prev) => {
            const next = prev.filter((img) => {
              if (img.key === key && img.previewUrl) {
                URL.revokeObjectURL(img.previewUrl);
              }
              return img.key !== key;
            });
            return next;
          });
        }
      });

      await Promise.all(uploads);
    },
    [bucketName, supabase, updateImage]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      event.currentTarget.value = "";
    },
    [handleFiles]
  );

  const removeImage = useCallback((key: string) => {
    setImages((prev) => {
      const next: UploadedImage[] = [];
      for (const image of prev) {
        if (image.key === key) {
          if (image.previewUrl) {
            URL.revokeObjectURL(image.previewUrl);
          }
          continue;
        }
        next.push(image);
      }
      return next;
    });
  }, []);

  const move = useCallback((from: number, to: number) => {
    setImages((prev) => {
      const copy = [...prev];
      if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) {
        return prev;
      }

      const [item] = copy.splice(from, 1);
      if (!item) return prev;
      copy.splice(to, 0, item);
      return copy;
    });
  }, []);

  const setCover = useCallback((key: string) => {
    setImages((prev) => prev.map((image) => ({ ...image, isCover: image.key === key })));
  }, []);

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-lg border border-dashed border-black/10 p-4 text-center transition hover:border-brand-teal focus-within:border-brand-teal"
        aria-label="Upload listing images"
      >
        <p className="text-sm text-text-muted">Drag and drop images here or</p>
        <label className="mt-2 inline-block cursor-pointer rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            className="sr-only"
            aria-label="Choose images to upload"
          />
          Upload images
        </label>
        <p className="mt-2 text-xs text-text-muted">PNG or JPEG up to 5MB each.</p>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {images.map((img, index) => (
          <div key={img.key} className="relative rounded-lg border border-black/10 p-2 shadow-sm">
            {img.uploading ? (
              <div className="flex h-40 items-center justify-center text-sm text-text-muted" role="status" aria-live="polite">
                Uploading...
              </div>
            ) : (
              <Image
                src={img.url}
                alt={img.isCover ? "Cover photo preview" : `Listing image ${index + 1}`}
                className="h-40 w-full rounded-md object-cover"
                width={320}
                height={240}
              />
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-full border border-black/10 px-2 py-1 transition hover:border-brand-teal hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
                  onClick={() => setCover(img.key)}
                  aria-pressed={img.isCover}
                >
                  {img.isCover ? "Cover photo" : "Set as cover"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-black/10 px-2 py-1 transition hover:border-red-500 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  onClick={() => removeImage(img.key)}
                >
                  Remove
                </button>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  className={reorderButtonClass}
                  aria-label="Move image earlier"
                >
                  <span aria-hidden="true">Up</span>
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => move(index, index + 1)}
                  className={reorderButtonClass}
                  aria-label="Move image later"
                >
                  <span aria-hidden="true">Down</span>
                </button>
              </div>
            </div>

            <input type="hidden" name={`${name}[]`} value={img.key} />
            {img.isCover ? <input type="hidden" name="cover" value={img.key} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
