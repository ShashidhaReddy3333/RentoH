import { cva } from "class-variance-authority";
import clsx from "clsx";
import { forwardRef, useId } from "react";

const selectVariants = cva(
  "block w-full rounded-lg border border-brand-outline/70 bg-surface px-3 py-2 text-sm text-textc shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
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

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  helperText?: string;
  error?: string;
  requiredMarker?: boolean;
  wrapperClassName?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  {
    id,
    label,
    helperText,
    error,
    className,
    wrapperClassName,
    requiredMarker = true,
    required,
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
    <div className={clsx("grid gap-1.5", wrapperClassName)}>
      <label htmlFor={resolvedId} className="text-sm font-medium text-brand-dark">
        {label}
        {required && requiredMarker ? (
          <span aria-hidden="true" className="ml-1 text-brand-primary">
            *
          </span>
        ) : null}
      </label>
      <select
        ref={ref}
        id={resolvedId}
        className={clsx(selectVariants({ invalid: Boolean(error) }), className)}
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
});

SelectField.displayName = "SelectField";

