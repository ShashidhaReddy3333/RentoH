"use client";

import type { ComponentProps } from "react";
import { useState } from "react";

import Image from "next/image";
import clsx from "clsx";

import { Skeleton } from "@/components/ui/skeleton";

type ImageProps = ComponentProps<typeof Image>;

type ImageWithSkeletonProps = ImageProps & {
  wrapperClassName?: string;
};

export function ImageWithSkeleton({
  wrapperClassName,
  className,
  onLoadingComplete,
  alt,
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoadingComplete: ImageProps["onLoadingComplete"] = (image) => {
    setLoaded(true);
    if (onLoadingComplete) {
      onLoadingComplete(image);
    }
  };

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
        {...props}
        onLoadingComplete={handleLoadingComplete}
        className={clsx(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
}
