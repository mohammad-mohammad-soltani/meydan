import type { ReactNode } from "react";
import "@/features/works/works.css";
import { WorksWorkspace } from "@/features/works/components/WorksWorkspace";
export default function WorksLayout({ children }: { children: ReactNode }) {
  return <WorksWorkspace>{children}</WorksWorkspace>;
}
