"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRouteTransition } from "./RouteTransitionProvider";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isTransitioning, pendingPath } = useRouteTransition();
  const isLeaving = isTransitioning && pendingPath !== pathname;

  return <div key={pathname} className={isLeaving ? "route-page-exit min-h-full w-full" : "route-page-enter min-h-full w-full"}>{children}</div>;
}
