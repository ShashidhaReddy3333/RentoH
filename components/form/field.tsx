
import { cloneElement, isValidElement } from "react";
import type { ReactElement } from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactElement;
};

export default function Field({ id, label, hint, required, children }: FieldProps) {
  let control: ReactElement = children;
  if (isValidElement(children)) {
    const childId = (children.props as { id?: string }).id;
    if (!childId) {
      const nextProps: Record<string, unknown> = { id };
      if (required !== undefined) {
        nextProps.required = required;
      }
      control = cloneElement(children, nextProps);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {control}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
  );
}

