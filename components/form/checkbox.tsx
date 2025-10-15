"use client";

type CheckboxProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function Checkbox({ id, label, checked, onChange }: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 text-sm text-textc/80">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-black/10 text-brand-primary focus:ring-brand-primary dark:border-white/20"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
