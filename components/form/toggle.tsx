"use client";

type ToggleProps = {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
};

export default function Toggle({ id, checked, onChange, label }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
        checked
          ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
          : "border-black/10 text-textc/70 dark:border-white/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full transition ${
          checked ? "translate-x-0.5 bg-brand-primary" : "bg-textc/30 dark:bg-white/30"
        }`}
      />
      {label}
    </button>
  );
}
