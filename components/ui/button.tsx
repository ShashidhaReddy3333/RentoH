import React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

export const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-teal text-white hover:brightness-90",
        outline: "border border-brand-dark/20 text-brand-dark hover:bg-white/40",
        ghost: "text-brand-dark hover:bg-white/40"
      },
      size: { sm: "h-9 px-4", md: "h-11 px-5 text-base", lg: "h-12 px-6 text-base" }
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
