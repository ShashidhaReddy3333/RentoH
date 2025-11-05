import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const buttonVariants = cva(
  [
    "inline-flex",
    "items-center",
    "justify-center",
    "whitespace-nowrap",
    "gap-2",
    "rounded-lg",
    "font-semibold",
    "transition-colors",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-brand-blue/50",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-white",
    "disabled:cursor-not-allowed",
    "disabled:opacity-60"
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-brand-blue text-white shadow-sm hover:bg-brand-blue/90",
        secondary:
          "border border-outline bg-white text-brand-dark shadow-sm hover:border-brand-blue hover:text-brand-blue",
        ghost: "text-brand-blue hover:bg-brand-blue/10",
        danger: "bg-danger text-white shadow-sm hover:bg-danger/90 focus-visible:ring-danger/50"
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-6 text-base"
      },
      align: {
        start: "justify-start",
        center: "justify-center"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      align: "center"
    }
  }
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariants & {
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };

const Spinner = () => (
  <svg
    className="h-4 w-4 animate-spin text-current"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="8"
      cy="8"
      r="7"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      className="opacity-75"
      d="M15 8a7 7 0 0 0-7-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const buttonStyles = buttonVariants;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      align,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={clsx(buttonVariants({ variant, size, align }), className)}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <Spinner />
        ) : (
          leftIcon && <span className="inline-flex items-center">{leftIcon}</span>
        )}
        <span>{children}</span>
        {isLoading ? null : rightIcon ? (
          <span className="inline-flex items-center">{rightIcon}</span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = "Button";
