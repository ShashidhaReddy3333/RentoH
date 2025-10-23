import React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

export const buttonStyles = cva(
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-teal text-white shadow-sm hover:bg-brand-teal/90 focus-visible:ring-brand-teal/80",
        outline:
          "border border-brand-teal/30 bg-surface text-brand-teal hover:border-brand-teal hover:bg-brand-teal/10 dark:border-brand-teal/40 dark:bg-surface dark:text-brand-teal",
        ghost: "text-textc hover:bg-brand-teal/10 dark:text-textc",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-600/70"
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
