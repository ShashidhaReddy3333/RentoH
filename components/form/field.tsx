
import { cloneElement, isValidElement } from "react";
import type { ReactElement } from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactElement;
};

export default function Field({ id, label, hint, error, required, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  let control: ReactElement = children;
  if (isValidElement(children)) {
    const childId = (children.props as { id?: string }).id;
    const nextProps: Record<string, unknown> = {};
  if (!childId) nextProps["id"] = id;
  if (required !== undefined) nextProps["required"] = required;
    nextProps["aria-describedby"] = describedBy;
    if (error) nextProps["aria-invalid"] = true;
    control = cloneElement(children, nextProps);
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-textc">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {control}
      {hint && <span id={`${id}-hint`} className="text-xs text-textc/60">{hint}</span>}
      {error && <span id={`${id}-error`} className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

