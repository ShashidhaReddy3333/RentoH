import type { ReactNode } from "react";

type SearchLayoutProps = {
  list: ReactNode;
  map: ReactNode;
};

export function SearchLayout({ list, map }: SearchLayoutProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="order-2 space-y-4 xl:order-1">{list}</div>
      <div className="order-1 xl:order-2">
        <div className="sticky top-28 h-[360px] xl:h-[calc(100vh-8.5rem)]">{map}</div>
      </div>
    </div>
  );
}
