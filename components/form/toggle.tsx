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
          ? "bg-[var(--c-primary)]/10 border-[var(--c-primary)] text-[var(--c-primary)]"
          : "border-gray-300 text-gray-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full transition ${
          checked ? "bg-[var(--c-primary)] translate-x-0.5" : "bg-gray-300"
        }`}
      />
      {label}
    </button>
  );
}
