"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_FILE_COUNT = 12;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type UploadedImage = {
  id: string;
  storageKey: string;
  url: string;
  previewUrl?: string;
  isCover: boolean;
  uploading: boolean;
};

const reorderButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-brand-outline/70 bg-white text-xs text-neutral-600 transition hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function uniqueId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read file"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

function ensureCover(images: UploadedImage[]): UploadedImage[] {
  if (images.length === 0) {
    return images;
  }
  if (images.some((image) => image.isCover)) {
    return images;
  }
  const [first, ...rest] = images;
  if (!first) {
    return images;
  }
  return [{ ...first, isCover: true }, ...rest];
}

type ListingImageUploaderProps = {
  value?: Array<{ key: string; url: string; isCover?: boolean }>;
  initialImages?: Array<{ key: string; url: string; isCover?: boolean }>;
  onChange?: (
    images: Array<{ key: string; url: string; isCover?: boolean }>,
    coverKey?: string | null
  ) => void;
  maxFiles?: number;
};

export default function ListingImageUploader({
  value,
  initialImages = [],
  onChange,
  maxFiles = MAX_FILE_COUNT
}: ListingImageUploaderProps) {
  const supabase = createSupabaseBrowserClient();
  const bucketName = clientEnv.NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS ?? "listings";

  const normalizedInitialImages = useMemo<UploadedImage[]>(() => {
    const source = (value ?? initialImages) ?? [];
    const hasCover = source.some((image) => image.isCover);
    return source.map((image, index) => ({
      id: image.key,
      storageKey: image.key,
      url: image.url,
      previewUrl: undefined,
      isCover: hasCover ? Boolean(image.isCover) : index === 0,
      uploading: false
    }));
  }, [initialImages, value]);

  const [images, setImages] = useState<UploadedImage[]>(normalizedInitialImages);
  const [error, setError] = useState<string | null>(null);

  const uploadingCount = useMemo(
    () => images.filter((image) => image.uploading).length,
    [images]
  );

  useEffect(() => {
    setImages(normalizedInitialImages);
  }, [normalizedInitialImages]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  const emitChange = useCallback(
    (list: UploadedImage[]) => {
      if (!onChange) return;
      const payload = list.map((image) => ({
        key: image.storageKey,
        url: image.url,
        isCover: image.isCover
      }));
      const coverKey = list.find((image) => image.isCover)?.storageKey ?? null;
      onChange(payload, coverKey);
    },
    [onChange]
  );

  const setImagesAndEmit = useCallback(
    (updater: (current: UploadedImage[]) => UploadedImage[]) => {
      setImages((prev) => {
        const next = ensureCover(updater(prev));
        emitChange(next);
        return next;
      });
    },
    [emitChange]
  );

  const updateImage = useCallback(
    (id: string, updater: (current: UploadedImage) => UploadedImage | null) => {
      setImagesAndEmit((prev) => {
        const next: UploadedImage[] = [];
        for (const image of prev) {
          if (image.id !== id) {
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
    },
    [setImagesAndEmit]
  );

  const removeImage = useCallback(
    (id: string) => {
      setImagesAndEmit((prev) => {
        const next: UploadedImage[] = [];
        for (const image of prev) {
          if (image.id === id) {
            if (image.previewUrl) {
              URL.revokeObjectURL(image.previewUrl);
            }
            continue;
          }
          next.push(image);
        }
        return next;
      });
    },
    [setImagesAndEmit]
  );

  const move = useCallback(
    (from: number, to: number) => {
      setImagesAndEmit((prev) => {
        const copy = [...prev];
        if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) {
          return prev;
        }
        const [item] = copy.splice(from, 1);
        if (!item) {
          return prev;
        }
        copy.splice(to, 0, item);
        return copy;
      });
    },
    [setImagesAndEmit]
  );

  const setCover = useCallback(
    (id: string) => {
      setImagesAndEmit((prev) =>
        prev.map((image) => ({
          ...image,
          isCover: image.id === id
        }))
      );
    },
    [setImagesAndEmit]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setError(null);

      if (images.length >= maxFiles) {
        setError(`You can upload up to ${maxFiles} photos per listing.`);
        return;
      }

      const availableSlots = maxFiles - images.length;
      const incomingFiles = Array.from(files).slice(0, availableSlots);
      if (incomingFiles.length < files.length) {
        setError(`Only the first ${availableSlots} images were added (limit ${maxFiles}).`);
      }

      const validateFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`"${file.name}" is larger than 5MB.`);
        }
      };

      try {
        for (const file of incomingFiles) {
          validateFile(file);
        }
      } catch (validationError) {
        setError(validationError instanceof Error ? validationError.message : "Invalid file selected.");
        return;
      }

      if (!supabase) {
        // Fallback mode: store files locally (useful when Supabase isn't configured in dev)
        await Promise.all(
          incomingFiles.map(async (file) => {
            try {
              const objectUrl = URL.createObjectURL(file);
              const dataUrl = await readFileAsDataUrl(file);

              setImagesAndEmit((prev) => [
                ...prev,
                {
                  id: `local-${uniqueId()}`,
                  storageKey: dataUrl,
                  url: objectUrl,
                  previewUrl: objectUrl,
                  isCover: false,
                  uploading: false
                }
              ]);
            } catch (fallbackError) {
              console.error("[listings] Failed to process image locally", fallbackError);
              setError("We couldn't process one of the images locally. Please try again.");
            }
          })
        );
        return;
      }

      const { data: userResult, error: userError } = await supabase.auth.getUser();
      const user = userResult?.user;
      if (userError || !user) {
        setError("You need to be signed in as a landlord to upload listing photos.");
        return;
      }

      const uploads = incomingFiles.map(async (file) => {
        const id = `${user.id}/${uniqueId()}-${sanitizeFilename(file.name)}`;
        const previewUrl = URL.createObjectURL(file);

        setImagesAndEmit((prev) => [
          ...prev,
          {
            id,
            storageKey: id,
            url: previewUrl,
            previewUrl,
            isCover: false,
            uploading: true
          }
        ]);

        try {
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(id, file, { cacheControl: "3600", upsert: false });
          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(id);
          const publicUrl = publicData?.publicUrl ?? "";

          updateImage(id, (image) => ({
            ...image,
            url: publicUrl || image.url,
            previewUrl: undefined,
            uploading: false
          }));
        } catch (uploadErr) {
          console.error("[listings] Failed to upload image", uploadErr);
          setError("Failed to upload one of the images. Please try again.");
          removeImage(id);
        }
      });

      await Promise.all(uploads);
    },
    [bucketName, images.length, maxFiles, removeImage, setImagesAndEmit, supabase, updateImage]
  );

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      void handleFiles(event.target.files);
      event.target.value = "";
    },
    [handleFiles]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      void handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="rounded-2xl border border-dashed border-brand-outline/70 bg-white/60 p-5 text-center transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-white hover:border-brand-primary"
        aria-label="Upload listing images"
      >
        <p className="text-sm text-neutral-600">Drag and drop images here or</p>
        <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
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
        <p className="mt-2 text-xs text-neutral-500">
          PNG or JPEG up to 5MB each. Max {maxFiles} images.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-2xl border border-danger/40 bg-danger-muted px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {uploadingCount > 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-brand-outline/60 bg-brand-primaryMuted/60 px-4 py-3 text-sm text-brand-primary"
        >
          Uploading {uploadingCount} {uploadingCount === 1 ? "image" : "images"}…
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="group relative overflow-hidden rounded-2xl border border-brand-outline/60 bg-white shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-brand-primary/30"
          >
            <div className="relative aspect-[4/3] w-full bg-neutral-100">
              {img.uploading ? (
                <div
                  className="flex h-full items-center justify-center text-sm font-medium text-neutral-500"
                  role="status"
                  aria-live="polite"
                >
                  Uploading…
                </div>
              ) : (
                <Image
                  src={img.url}
                  alt={img.isCover ? "Cover photo preview" : `Listing image ${index + 1}`}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}

              {img.isCover ? (
                <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Cover photo
                </span>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {!img.isCover ? (
                  <button
                    type="button"
                    onClick={() => setCover(img.id)}
                    className="inline-flex items-center rounded-full border border-brand-outline/70 px-3 py-1 text-xs font-medium text-brand-dark transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    aria-pressed="false"
                  >
                    Set as cover
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="inline-flex items-center rounded-full border border-brand-outline/70 px-3 py-1 text-xs font-medium text-danger transition hover:border-danger hover:bg-danger-muted/60 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  aria-label={`Remove image ${index + 1}`}
                >
                  Remove
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  className={reorderButtonClass}
                  aria-label={`Move image ${index + 1} earlier`}
                  title="Move earlier"
                >
                  <span aria-hidden="true">Up</span>
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => move(index, index + 1)}
                  className={reorderButtonClass}
                  aria-label={`Move image ${index + 1} later`}
                  title="Move later"
                >
                  <span aria-hidden="true">Down</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
