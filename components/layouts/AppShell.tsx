import type { ReactNode } from "react";
import Link from "next/link";
import { FolderKanban, Home, Map, MessageSquare, Mic, UserCheck } from "lucide-react";
import { BottomNavigation } from "./BottomNavigation";
import { MobileHeader } from "./MobileHeader";

type AppShellProps = { children: ReactNode };

const desktopLinkClass = "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground";

/** Shared application chrome. Feature state stays inside route features. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full justify-center bg-background text-foreground">
      <aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-l border-border bg-surface p-4 lg:flex">
        <div className="space-y-6">
          <Link href="/home" className="flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-lg font-black text-brand-foreground">م</span>
            <span>
              <span className="block text-base font-black text-foreground">میدانِ خیابان</span>
              <span className="block text-[11px] text-muted-foreground">شبکه سراسری میادین ایران</span>
            </span>
          </Link>
          <nav aria-label="ناوبری دسکتاپ" className="space-y-1.5 text-sm font-bold">
            <Link href="/home" className={desktopLinkClass}><Home className="h-5 w-5" />خانه و روایت‌ها</Link>
            <Link href="/content" className={desktopLinkClass}><FolderKanban className="h-5 w-5" />بسته محتوا</Link>
            <Link href="/speakers" className={desktopLinkClass}><Mic className="h-5 w-5" />اعزام سخنران</Link>
            <Link href="/map" className={desktopLinkClass}><Map className="h-5 w-5" />نقشه زنده</Link>
            <Link href="/chat" className={desktopLinkClass}><MessageSquare className="h-5 w-5" />گفتگوها</Link>
            <Link href="/profile" className={desktopLinkClass}><UserCheck className="h-5 w-5" />هویت و پایگاه</Link>
          </nav>
        </div>
      </aside>

      <div id="mainAppShell" className="relative flex h-[100dvh] min-h-0 w-full max-w-xl flex-col border-x border-border bg-background transition-colors duration-150">
        <MobileHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden no-scrollbar">
          {children}
          <div aria-hidden="true" className="h-[calc(5.5rem+env(safe-area-inset-bottom))] w-full shrink-0 lg:hidden" />
        </main>
        <BottomNavigation />
      </div>

      <aside className="hidden h-screen w-72 shrink-0 space-y-4 overflow-y-auto border-r border-border bg-surface p-4 lg:flex lg:flex-col">
        <div className="rounded-card border border-border bg-card p-3.5 text-xs text-card-foreground shadow-xs">
          <h2 className="font-black">ترندهای داغ میادین</h2>
          <p className="mt-2 text-muted-foreground">نمای مشترک اطلاعات و روندهای میدانی</p>
        </div>
      </aside>
    </div>
  );
}
