import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  icon?: ReactNode;
  href?: string;
};

export default function StatCard({ title, value, change, icon, href }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{title}</span>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-semibold text-brand-dark">{value}</p>
        {change && <p className="text-xs font-semibold text-brand-green">{change}</p>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link 
        href={href as Route}
        className="flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-soft hover:border-brand-teal/40 hover:shadow-md transition cursor-pointer"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-soft">
      {content}
    </div>
  );
}
