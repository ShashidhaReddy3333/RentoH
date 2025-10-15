"use client";

type CheckboxProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function Checkbox({ id, label, checked, onChange }: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 text-sm text-gray-700">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-[var(--c-primary)] focus:ring-[var(--c-primary)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
