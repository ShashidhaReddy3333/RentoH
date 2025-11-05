"use client";

type DayDividerProps = {
  label: string;
};

export default function DayDivider({ label }: DayDividerProps) {
  return (
    <div className="my-4 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      <span aria-label={`Messages from ${label}`}>{label}</span>
      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
    </div>
  );
}
