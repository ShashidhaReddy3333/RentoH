import clsx from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

export const badgeVariants = cva(
  [
    "inline-flex",
    "items-center",
    "gap-1.5",
    "rounded-full",
    "border",
    "border-transparent",
    "px-3",
    "py-1",
    "text-xs",
    "font-medium",
    "uppercase",
    "tracking-wide"
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-brand-blue/10 text-brand-blue",
        success: "bg-success.subtle text-success border-success/40",
        warning: "bg-brand-yellow/15 text-brand-dark border-brand-yellow/40",
        muted: "bg-surface-muted text-ink-muted border-outline/60",
        outline: "bg-white text-brand-dark border-outline/70"
      },
      tone: {
        solid: "font-semibold",
        soft: ""
      }
    },
    defaultVariants: {
      variant: "default",
      tone: "soft"
    }
  }
);

type BadgeProps = VariantProps<typeof badgeVariants> & {
  className?: string;
  children: ReactNode;
  leadingIcon?: ReactNode;
};

export function Badge({ className, children, leadingIcon, variant, tone }: BadgeProps) {
  return (
    <span className={clsx(badgeVariants({ variant, tone }), className)}>
      {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
      {children}
    </span>
  );
}
