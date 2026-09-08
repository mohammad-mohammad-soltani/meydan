import type { ReactNode } from "react";
import Link from "next/link";
import { FolderKanban, Home, Map, MessageSquare, Mic, UserCheck } from "lucide-react";
import { SearchProvider } from "@/components/providers/SearchProvider";
import { RouteTransitionProvider } from "./RouteTransitionProvider";
import { LegacySearchModal } from "@/components/prototype/LegacySearchModal";
import { BottomNavigation } from "./BottomNavigation";
import { MobileHeader } from "./MobileHeader";

type AppShellProps = { children: ReactNode };

/** Shared application chrome. Feature state stays inside route features. */
export function AppShell({ children }: AppShellProps) {
  return (
    <SearchProvider>
      <RouteTransitionProvider>
      <div className="mx-auto flex min-h-screen w-full justify-center">
      <aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-l border-slate-200 bg-white p-4 dark:border-slate-800/80 dark:bg-[#070a0f] lg:flex">
        <div className="space-y-6">
          <Link href="/home" className="flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-red text-lg font-black text-white">م</span>
            <span><span className="block text-base font-black">میدانِ خیابان</span><span className="block text-[11px] text-slate-500">شبکه سراسری میادین ایران</span></span>
          </Link>
          <nav aria-label="ناوبری دسکتاپ" className="space-y-1.5 text-sm font-bold">
            <Link href="/home" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 transition hover:bg-slate-100 dark:hover:bg-slate-900"><Home className="h-5 w-5" />خانه و روایت‌ها</Link>
            <Link href="/content" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 transition hover:bg-slate-100 dark:hover:bg-slate-900"><FolderKanban className="h-5 w-5" />بسته محتوا</Link>
            <Link href="/speakers" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 transition hover:bg-slate-100 dark:hover:bg-slate-900"><Mic className="h-5 w-5" />اعزام سخنران</Link>
            <Link href="/map" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 transition hover:bg-slate-100 dark:hover:bg-slate-900"><Map className="h-5 w-5" />نقشه زنده</Link>
            <Link href="/chat" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 transition hover:bg-slate-100 dark:hover:bg-slate-900"><MessageSquare className="h-5 w-5" />گفتگوها</Link>
            <Link href="/profile" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 transition hover:bg-slate-100 dark:hover:bg-slate-900"><UserCheck className="h-5 w-5" />هویت و پایگاه</Link>
          </nav>
        </div>
      </aside>

      <div id="mainAppShell" className="relative flex h-[100dvh] min-h-screen w-full max-w-xl flex-col border-x border-slate-200 bg-white transition-colors duration-150 dark:border-slate-800/80 dark:bg-[#070a0f]">
        <MobileHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] no-scrollbar lg:pb-0">{children}</main>
        <BottomNavigation />
      </div>

      <aside className="hidden h-screen w-72 shrink-0 space-y-4 overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800/80 dark:bg-[#070a0f] lg:flex lg:flex-col">
        <div className="rounded-2xl border border-slate-200 p-3.5 text-xs dark:border-slate-800"><h2 className="font-black">ترندهای داغ میادین</h2><p className="mt-2 text-slate-500">نمای مشترک اطلاعات و روندهای میدانی</p></div>
      </aside>
      </div>
      <LegacySearchModal />
      </RouteTransitionProvider>
    </SearchProvider>
  );
}
