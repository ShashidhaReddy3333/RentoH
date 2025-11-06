import clsx from "clsx";
import React, { forwardRef, useId } from "react";

const baseInputClasses =
  "block w-full rounded-lg border border-brand-outline/70 bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-neutral-500 shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasFloatingLabel?: boolean;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", hasFloatingLabel = false, invalid = false, placeholder, ...props },
  ref
) {
  const resolvedPlaceholder =
    hasFloatingLabel && (placeholder === undefined || placeholder === null || placeholder === "")
      ? " "
      : placeholder;

  return (
    <input
      ref={ref}
      type={type}
      placeholder={resolvedPlaceholder}
      className={clsx(
        hasFloatingLabel ? "floating-input" : baseInputClasses,
        invalid && "border-danger text-danger placeholder:text-danger focus-visible:ring-danger/40",
        className
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

type InputFieldProps = InputProps & {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  requiredMarker?: boolean;
  wrapperClassName?: string;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
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
  const inputId = id ?? generatedId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={clsx("space-y-1.5", wrapperClassName)}>
      <div className="field-wrapper">
        <Input
          id={inputId}
          ref={ref}
          className={className}
          hasFloatingLabel={Boolean(label)}
          invalid={Boolean(error)}
          aria-describedby={describedBy}
          required={required}
          {...props}
        />
        {label ? (
          <label htmlFor={inputId} className="floating-label">
            {label}
            {required && requiredMarker ? (
              <span aria-hidden="true" className="ml-1 text-brand-primary">
                *
              </span>
            ) : null}
          </label>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger" role="alert" aria-live="polite">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-neutral-500" aria-live="polite">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

InputField.displayName = "InputField";
