import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/layouts/BottomNavigation";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative min-h-[100dvh] pb-16">
      {children}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}
