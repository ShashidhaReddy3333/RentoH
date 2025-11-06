import clsx from "clsx";
import type { ReactNode } from "react";

type FormSectionProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({ id, title, description, children, className }: FormSectionProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className={clsx("space-y-4", className)}>
      <header>
        <h2 id={`${id}-heading`} className="text-2xl font-semibold text-brand-dark">
          {title}
        </h2>
        {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

