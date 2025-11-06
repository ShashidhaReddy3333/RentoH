import clsx from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

export const badgeVariants = cva(
  [
    "inline-flex",
    "items-center",
    "gap-1.5",
    "rounded-full",
    "border border-transparent",
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
        default: "bg-brand-primaryMuted text-brand-primary",
        success: "bg-brand-successMuted text-brand-success",
        warning: "bg-brand-warningMuted text-brand-warning",
        muted: "bg-neutral-100 text-neutral-600 border-neutral-200",
        outline: "bg-surface text-textc border-brand-outline/70"
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
