"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

type ChipProps = {
  children: ReactNode;
  className?: string;
};

export default function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border border-brand-outline/60 bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark",
        className
      )}
    >
      {children}
    </span>
  );
}
