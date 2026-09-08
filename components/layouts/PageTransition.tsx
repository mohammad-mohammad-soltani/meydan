"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return <div key={pathname} className="route-page-enter min-h-full w-full">{children}</div>;
}
