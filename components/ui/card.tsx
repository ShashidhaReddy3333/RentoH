import React from "react";

export function Card({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-brand-dark/10 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-slate-900/80 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
