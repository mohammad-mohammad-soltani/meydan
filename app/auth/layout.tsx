import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/layouts/BottomNavigation";
import { isAuthenticated } from "@/lib/meydan-session";

export default async function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  const authenticated = await isAuthenticated();

  return (
    <div className="relative min-h-[100dvh] pb-16">
      {children}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <BottomNavigation isAuthenticated={authenticated} />
      </div>
    </div>
  );
}
