import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-brand-blue/30 bg-white p-10 text-center shadow-soft">
      {icon && <div className="text-brand-teal">{icon}</div>}
      <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
      <p className="max-w-md text-sm text-text-muted">{description}</p>
      {action}
    </section>
  );
}
