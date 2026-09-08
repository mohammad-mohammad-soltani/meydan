import type { ReactNode } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { PageTransition } from "@/components/layouts/PageTransition";

export default function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AppShell><PageTransition>{children}</PageTransition></AppShell>;
}
