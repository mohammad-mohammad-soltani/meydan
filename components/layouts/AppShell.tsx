import type { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { MobileHeader } from "./MobileHeader";

type AppShellProps = { children: ReactNode };

/** Shared application chrome. Feature state stays inside route features. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full justify-center">
      <aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-l border-slate-200 bg-white p-4 dark:border-slate-800/80 dark:bg-[#070a0f] lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-red text-lg font-black text-white">م</div>
            <div><h1 className="text-base font-black">میدانِ خیابان</h1><p className="text-[11px] text-slate-500">شبکه سراسری میادین ایران</p></div>
          </div>
        </div>
      </aside>

      <div id="mainAppShell" className="relative flex h-[100dvh] min-h-screen w-full max-w-xl flex-col border-x border-slate-200 bg-white transition-colors duration-150 dark:border-slate-800/80 dark:bg-[#070a0f]">
        <MobileHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">{children}</main>
        <BottomNavigation />
      </div>

      <aside className="hidden h-screen w-72 shrink-0 space-y-4 overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800/80 dark:bg-[#070a0f] lg:flex lg:flex-col">
        <div className="rounded-2xl border border-slate-200 p-3.5 text-xs dark:border-slate-800"><h2 className="font-black">ترندهای داغ میادین</h2><p className="mt-2 text-slate-500">نمای مشترک اطلاعات و روندهای میدانی</p></div>
      </aside>
    </div>
  );
}
