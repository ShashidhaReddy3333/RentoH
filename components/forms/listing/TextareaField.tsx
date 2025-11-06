import { cva } from "class-variance-authority";
import clsx from "clsx";
import { forwardRef, useId } from "react";

const textareaVariants = cva(
  "min-h-[140px] rounded-lg border border-brand-outline/70 bg-surface px-3 py-2 text-sm text-textc shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  {
    variants: {
      invalid: {
        true: "border-danger text-danger focus-visible:ring-danger/40",
        false: ""
      }
    },
    defaultVariants: {
      invalid: false
    }
  }
);

type TextareaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  helperText?: string;
  requiredMarker?: boolean;
  wrapperClassName?: string;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    {
      id,
      label,
      error,
      helperText,
      required,
      requiredMarker = true,
      className,
      wrapperClassName,
      rows = 5,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;
    const helperId = helperText ? `${resolvedId}-helper` : undefined;
    const errorId = error ? `${resolvedId}-error` : undefined;
    const describedBy = [ariaDescribedBy, errorId, helperId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={clsx("space-y-1.5", wrapperClassName)}>
        <label htmlFor={resolvedId} className="text-sm font-medium text-brand-dark">
          {label}
          {required && requiredMarker ? (
            <span aria-hidden="true" className="ml-1 text-brand-primary">
              *
            </span>
          ) : null}
        </label>
        <textarea
          ref={ref}
          id={resolvedId}
          rows={rows}
          className={clsx(textareaVariants({ invalid: Boolean(error) }), className)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          required={required}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-sm text-neutral-600">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextareaField.displayName = "TextareaField";

