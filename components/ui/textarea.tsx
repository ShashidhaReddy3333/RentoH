import clsx from "clsx";
import React, { forwardRef, useId } from "react";

const baseTextareaClasses =
  "block w-full rounded-lg border border-outline/70 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted shadow-sm transition focus-visible:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(baseTextareaClasses, "resize-y", className)}
      {...props}
    />
  );
});

type TextareaFieldProps = TextareaProps & {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  requiredMarker?: boolean;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    {
      id,
      label,
      helperText,
      error,
      className,
      rows,
      required,
      requiredMarker = true,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const helperId = helperText ? `${textareaId}-helper` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy = [ariaDescribedBy, errorId, helperId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="grid gap-1.5">
        {label ? (
          <label htmlFor={textareaId} className="text-sm font-medium text-ink">
            {label}
            {required && requiredMarker ? <span className="ml-1 text-brand-blue">*</span> : null}
          </label>
        ) : null}
        <Textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={clsx(
            baseTextareaClasses,
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
  }
);

TextareaField.displayName = "TextareaField";
