import type { ButtonHTMLAttributes } from "react";

import clsx from "clsx";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ active = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg disabled:cursor-not-allowed disabled:opacity-60",
        active
          ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
          : "border-brand-outline/60 bg-surface text-textc hover:border-brand-teal hover:text-brand-teal",
        className
      )}
    >
      {children}
    </button>
  );
}
