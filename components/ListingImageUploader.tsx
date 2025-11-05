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
  "flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-xs text-ink-muted transition hover:bg-brand-teal/10 hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal disabled:opacity-40";

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
  name?: string;
  initialImages?: Array<{ key: string; url: string; isCover?: boolean }>;
};

export default function ListingImageUploader({ name = "images", initialImages = [] }: ListingImageUploaderProps) {
  const supabase = createSupabaseBrowserClient();
  const bucketName = clientEnv.NEXT_PUBLIC_SUPABASE_BUCKET_LISTINGS ?? "listings";

  const normalizedInitialImages = useMemo<UploadedImage[]>(() => {
    const hasCover = initialImages.some((image) => image.isCover);
    return initialImages.map((image, index) => ({
      id: image.key,
      storageKey: image.key,
      url: image.url,
      previewUrl: undefined,
      isCover: hasCover ? Boolean(image.isCover) : index === 0,
      uploading: false
    }));
  }, [initialImages]);

  const [images, setImages] = useState<UploadedImage[]>(normalizedInitialImages);
  const [error, setError] = useState<string | null>(null);

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

  const updateImage = useCallback((id: string, updater: (current: UploadedImage) => UploadedImage | null) => {
    setImages((prev) => {
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
      return ensureCover(next);
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
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
      return ensureCover(next);
    });
  }, []);

  const move = useCallback((from: number, to: number) => {
    setImages((prev) => {
      const copy = [...prev];
      if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) {
        return prev;
      }
      const [item] = copy.splice(from, 1);
      if (!item) {
        return prev;
      }
      copy.splice(to, 0, item);
      return ensureCover(copy);
    });
  }, []);

  const setCover = useCallback((id: string) => {
    setImages((prev) =>
      prev.map((image) => ({
        ...image,
        isCover: image.id === id
      }))
    );
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setError(null);

      if (images.length >= MAX_FILE_COUNT) {
        setError(`You can upload up to ${MAX_FILE_COUNT} photos per listing.`);
        return;
      }

      const availableSlots = MAX_FILE_COUNT - images.length;
      const incomingFiles = Array.from(files).slice(0, availableSlots);
      if (incomingFiles.length < files.length) {
        setError(`Only the first ${availableSlots} images were added (limit ${MAX_FILE_COUNT}).`);
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

              setImages((prev) => {
                const next: UploadedImage[] = [
                  ...prev,
                  {
                    id: `local-${uniqueId()}`,
                    storageKey: dataUrl,
                    url: objectUrl,
                    previewUrl: objectUrl,
                    isCover: false,
                    uploading: false
                  }
                ];
                return ensureCover(next);
              });
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

        setImages((prev) => {
          const next: UploadedImage[] = [
            ...prev,
            {
              id,
              storageKey: id,
              url: previewUrl,
              previewUrl,
              isCover: false,
              uploading: true
            }
          ];
          return ensureCover(next);
        });

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
    [bucketName, images.length, removeImage, supabase, updateImage]
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
    <div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="rounded-lg border border-dashed border-outline/80 p-4 text-center transition hover:border-brand-teal focus-within:border-brand-teal"
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
        <p className="mt-2 text-xs text-text-muted">PNG or JPEG up to 5MB each. Max {MAX_FILE_COUNT} images.</p>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-danger-subtle bg-danger-subtle/40 p-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {images.map((img, index) => (
          <div key={img.id} className="relative rounded-lg border border-outline/70 p-2 shadow-sm">
            {img.uploading ? (
              <div className="flex h-40 items-center justify-center text-sm text-ink-muted" role="status" aria-live="polite">
                Uploading...
              </div>
            ) : (
              <Image
                src={img.url}
                alt={img.isCover ? "Cover photo preview" : `Listing image ${index + 1}`}
                className="h-40 w-full rounded-md object-cover"
                width={320}
                height={240}
                unoptimized
              />
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-full border border-outline/60 px-2 py-1 transition hover:border-brand-teal hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
                  onClick={() => setCover(img.id)}
                  aria-pressed={img.isCover}
                >
                  {img.isCover ? "Cover photo" : "Set as cover"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-outline/60 px-2 py-1 transition hover:border-danger hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                  onClick={() => removeImage(img.id)}
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

            <input type="hidden" name={`${name}[]`} value={img.storageKey} />
            {img.isCover ? <input type="hidden" name="cover" value={img.storageKey} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
