"use client";

import type { ComponentProps } from "react";
import { useState } from "react";

import Image from "next/image";
import clsx from "clsx";

import { Skeleton } from "@/components/ui/skeleton";

type ImageProps = ComponentProps<typeof Image>;

type ImageWithSkeletonProps = ImageProps & {
  wrapperClassName?: string;
  priority?: ImageProps["priority"];
};

export function ImageWithSkeleton({
  wrapperClassName,
  className,
  onLoadingComplete,
  onError,
  alt,
  priority,
  loading,
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoadingComplete: ImageProps["onLoadingComplete"] = (image) => {
    setLoaded(true);
    if (onLoadingComplete) {
      onLoadingComplete(image);
    }
  };

  const handleError: ImageProps["onError"] = (e) => {
    setError(true);
    setLoaded(true);
    if (onError) {
      onError(e);
    }
  };

  if (error) {
    return (
      <div className={clsx("relative h-full w-full overflow-hidden bg-gray-100", wrapperClassName)}>
        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
          Image unavailable
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("relative h-full w-full overflow-hidden", wrapperClassName)}>
      <Skeleton
        className={clsx(
          "absolute inset-0 h-full w-full rounded-none",
          loaded && "opacity-0 transition-opacity duration-300"
        )}
      />
      <Image
        alt={alt}
        priority={priority}
        loading={priority ? undefined : loading ?? "lazy"}
        {...props}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        className={clsx(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
}
