import clsx from "clsx";
import type { ChangeEventHandler } from "react";
import { useId } from "react";

type ToggleProps = {
  id?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  onCheckedChange,
  disabled = false,
  className
}: ToggleProps) {
  const generatedId = useId();
  const toggleId = id ?? generatedId;
  const descriptionId = description ? `${toggleId}-description` : undefined;

  return (
    <label
      htmlFor={toggleId}
      className={clsx(
        "flex items-center justify-between gap-4 rounded-lg border border-outline/60 bg-white px-4 py-3 shadow-sm transition hover:border-brand-blue/50 focus-within:ring-2 focus-within:ring-brand-blue/40 focus-within:ring-offset-2 focus-within:ring-offset-white",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <span className="flex-1 text-left">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span id={descriptionId} className="mt-1 block text-xs text-ink-muted">
            {description}
          </span>
        ) : null}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={toggleId}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => {
            onChange?.(event);
            onCheckedChange?.(event.target.checked);
          }}
          aria-checked={checked}
          aria-describedby={descriptionId}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-outline/60 transition peer-checked:bg-brand-blue/80 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-blue/40"
        />
        <span
          aria-hidden="true"
          className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5 shadow-sm"
        />
      </span>
    </label>
  );
}
