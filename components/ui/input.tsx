import clsx from "clsx";
import React, { forwardRef, useId } from "react";

const baseInputClasses =
  "block w-full rounded-lg border border-outline/70 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted shadow-sm transition focus-visible:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref
) {
  return <input ref={ref} type={type} className={clsx(baseInputClasses, className)} {...props} />;
});

type InputFieldProps = InputProps & {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  requiredMarker?: boolean;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  {
    id,
    label,
    helperText,
    error,
    className,
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
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
          {required && requiredMarker ? <span className="ml-1 text-brand-blue">*</span> : null}
        </label>
      ) : null}
      <Input
        id={inputId}
        ref={ref}
        className={clsx(
          baseInputClasses,
          error
            ? "border-danger text-danger placeholder:text-danger focus-visible:ring-danger/40"
            : "border-outline/70",
          className
        )}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        required={required}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-ink-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

InputField.displayName = "InputField";
