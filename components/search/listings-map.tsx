import dynamic from "next/dynamic";

import type { ListingsMapProps } from "./map-impl";

const LazyMap = dynamic(() => import("./map-impl"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] rounded-2xl border border-slate-200 bg-white/60 shadow-inner dark:border-slate-700 dark:bg-slate-900/40" />
  )
});

export function ListingsMap(props: ListingsMapProps) {
  return <LazyMap {...props} />;
}
