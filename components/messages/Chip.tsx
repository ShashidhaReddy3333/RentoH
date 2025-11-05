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
        "inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600",
        className
      )}
    >
      {children}
    </span>
  );
}
