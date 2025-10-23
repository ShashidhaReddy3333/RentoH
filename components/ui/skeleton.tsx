import clsx from "clsx";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={clsx(
        "relative overflow-hidden rounded-2xl bg-slate-200/80 dark:bg-slate-700/60",
        className
      )}
    >
      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-60 dark:via-white/10" />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
