import type { ReactNode } from "react";

import { AppClientShell } from "@/components/layout/AppClientShell";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AppClientShell>{children}</AppClientShell>;
}

