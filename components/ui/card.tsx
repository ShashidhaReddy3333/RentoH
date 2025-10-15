import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-black/10 bg-surface/70 shadow-glass backdrop-blur dark:border-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
