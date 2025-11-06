"use client";

import clsx from "clsx";
import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  lines?: number;
  shimmer?: boolean;
};

export function Skeleton({
  className,
  lines = 1,
  shimmer = true,
  style,
  ...props
}: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className={clsx("space-y-3", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <BaseSkeleton
            key={index}
            className="h-3 rounded-full"
            shimmer={shimmer}
            style={
              index === lines - 1 ? { width: "65%", ...(style ?? {}) } : { ...(style ?? {}) }
            }
          />
        ))}
      </div>
    );
  }

  return <BaseSkeleton className={className} shimmer={shimmer} style={style} {...props} />;
}

type BaseSkeletonProps = HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean;
};

function BaseSkeleton({ className, shimmer, style, ...props }: BaseSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "relative h-4 overflow-hidden rounded-lg bg-gradient-to-br from-neutral-200/60 via-neutral-200 to-neutral-300/80",
        shimmer &&
          "after:absolute after:inset-0 after:animate-[shine_1.6s_ease-in-out_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent",
        className
      )}
      style={style}
      {...props}
    />
  );
}

// Inject keyframes once per browser session
if (typeof document !== "undefined" && !document.getElementById("skeleton-shine-keyframes")) {
  const styleTag = document.createElement("style");
  styleTag.id = "skeleton-shine-keyframes";
  styleTag.textContent = `
    @keyframes shine {
      0% {
        transform: translateX(-100%);
      }
      60%,
      100% {
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(styleTag);
}
