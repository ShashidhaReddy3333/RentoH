import React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

export const buttonStyles = cva(
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-teal text-white shadow-sm hover:bg-brand-teal/90 focus-visible:ring-brand-teal/80",
        outline:
          "border border-brand-teal/30 bg-white text-brand-teal hover:border-brand-teal hover:bg-brand-teal/10 dark:border-brand-teal/40 dark:bg-slate-900 dark:text-brand-teal",
        ghost:
          "text-brand-dark hover:bg-brand-teal/10 dark:text-slate-100"
      },
      size: {
        sm: "px-4 text-sm",
        md: "px-5 text-base",
        lg: "px-6 text-lg"
      }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonStyles({ variant, size }), className)}
      {...props}
    />
  )
);

Button.displayName = "Button";
