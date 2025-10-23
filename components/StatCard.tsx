import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  icon?: ReactNode;
};

export default function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{title}</span>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-semibold text-brand-dark">{value}</p>
        {change && <p className="text-xs font-semibold text-brand-green">{change}</p>}
      </div>
    </div>
  );
}
