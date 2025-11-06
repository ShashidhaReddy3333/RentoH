import clsx from "clsx";
import type { UseFormRegisterReturn } from "react-hook-form";

type AmenitiesOption = {
  value: string;
  label: string;
};

type AmenitiesFieldProps = {
  options: readonly AmenitiesOption[];
  register: UseFormRegisterReturn;
  error?: string;
};

export function AmenitiesField({ options, register, error }: AmenitiesFieldProps) {
  const describedBy = error ? "amenities-error" : undefined;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-brand-dark">Amenities</label>
        <p className="text-sm text-neutral-600">Select all amenities included with this rental.</p>
      </div>
      <div
        role="group"
        aria-describedby={describedBy}
        className={clsx(
          "grid gap-2 rounded-2xl border border-brand-outline/60 p-4 md:grid-cols-2",
          error && "border-danger"
        )}
      >
        {options.map((amenity) => (
          <label
            key={amenity.value}
            className="inline-flex select-none items-center gap-2 rounded-xl border border-brand-outline/50 bg-brand-light px-3 py-2 text-sm text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
          >
            <input
              type="checkbox"
              value={amenity.value}
              className="h-4 w-4 rounded border-brand-outline/60 text-brand-primary focus-visible:ring-brand-primary"
              {...register}
            />
            <span>{amenity.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p id="amenities-error" className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

