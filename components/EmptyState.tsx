import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-brand-outline/60 bg-white p-10 text-center shadow-sm">
      {icon ? <div className="text-brand-primary">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
      <p className="max-w-md text-sm text-neutral-600">{description}</p>
      {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
    </section>
  );
}
