"use client";

type CheckboxProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  error?: string;
};

export default function Checkbox({ id, label, checked, onChange, hint, error }: CheckboxProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 text-sm text-textc/80">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-black/10 text-brand-primary focus:ring-brand-primary dark:border-white/20"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={describedBy}
        aria-invalid={!!error}
      />
      {label}
      {hint && <span id={`${id}-hint`} className="ml-2 text-xs text-textc/60">{hint}</span>}
      {error && <span id={`${id}-error`} className="ml-2 text-xs text-red-600">{error}</span>}
    </label>
  );
}
