import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const buttonVariants = cva(
  [
    "inline-flex",
    "items-center",
    "justify-center",
    "gap-2",
    "whitespace-nowrap",
    "rounded-lg",
    "border",
    "border-transparent",
    "font-medium",
    "text-sm",
    "transition",
    "duration-150",
    "ease-out",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-brand-primary/40",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-brand-bg",
    "disabled:cursor-not-allowed",
    "disabled:opacity-60"
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-brand-primary text-white shadow-sm hover:bg-brand-primary/90 active:bg-brand-primary/80 focus-visible:ring-brand-primary/40 disabled:bg-brand-primary/50",
        secondary:
          "border-brand-outline/70 bg-surface text-textc shadow-sm hover:border-brand-primary hover:text-brand-primary active:bg-surface-muted focus-visible:ring-brand-primary/40",
        ghost: "border-transparent bg-transparent text-brand-primary hover:bg-brand-primaryMuted active:bg-brand-primary/20",
        danger:
          "border-transparent bg-danger text-white shadow-sm hover:bg-danger/90 active:bg-danger/80 focus-visible:ring-danger/40 disabled:bg-danger/50"
      },
      size: {
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-11 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-xl px-6 text-base"
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
    const isDisabled = Boolean(disabled ?? false) || isLoading;

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
