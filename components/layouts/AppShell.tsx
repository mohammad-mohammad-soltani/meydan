"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FolderKanban, Home, LogIn, Map, MessageCircle, Mic, Search, UserCheck } from "lucide-react";
import { MiniPlayer } from "@/features/audio/MiniPlayer";
import { PostLoginReturn } from "@/components/providers/AuthReturnToBridge";
import { UnreadProvider } from "@/features/chat/providers/UnreadProvider";
import { BottomNavigation } from "./BottomNavigation";
import { FloatingComposeButton } from "./FloatingComposeButton";
import { MobileHeader } from "./MobileHeader";
import { NavBadge } from "./NavBadge";
import { SidebarUserCard } from "./SidebarUserCard";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { usePathname } from "next/navigation";

type AppShellProps = { children: ReactNode; isAuthenticated?: boolean };

const desktopLinkClass = "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground";

export function AppShell({ children, isAuthenticated = false }: AppShellProps) {
  const pathname = usePathname();
  const isPostPage = pathname.startsWith("/posts/");
  const isComposePage = pathname === "/compose";

  return (
    <UnreadProvider isAuthenticated={isAuthenticated}>
      <div className="mx-auto flex min-h-[100dvh] w-full justify-center bg-background text-foreground">
        <PostLoginReturn />
        <aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-l border-border bg-background p-4 lg:flex">
          <div className="space-y-6">
            <Link href="/home" className="flex items-center gap-3 px-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-lg font-black text-brand-foreground">م</span>
              <span><span className="block text-base font-black text-foreground">میدانِ خیابان</span><span className="block text-[11px] text-muted-foreground">شبکه سراسری میادین ایران</span></span>
            </Link>
            <nav aria-label="ناوبری دسکتاپ" className="space-y-1.5 text-sm font-bold">
              <Link href="/home" className={desktopLinkClass}><Home className="h-5 w-5" />خانه و روایت‌ها</Link>
              <Link href="/content" className={desktopLinkClass}><FolderKanban className="h-5 w-5" />بسته محتوا</Link>
              <Link href="/speakers" className={desktopLinkClass}><Mic className="h-5 w-5" />اعزام سخنران</Link>
              <Link href="/map" className={desktopLinkClass}><Map className="h-5 w-5" />نقشه زنده</Link>
              <Link href="/chat" className={desktopLinkClass}><MessageCircle className="h-5 w-5" />گفتگو<NavBadge className="ms-auto" /></Link>
              <Link href="/explore" className={desktopLinkClass}><Search className="h-5 w-5" />کاوش و جستجو</Link>
              {isAuthenticated ? (
                <Link href="/profile" className={desktopLinkClass}><UserCheck className="h-5 w-5" />نمایه</Link>
              ) : (
                <Link href="/auth" className={desktopLinkClass}><LogIn className="h-5 w-5" />ورود</Link>
              )}
            </nav>
          </div>
          <div className="border-t border-divider pt-4">
            <SidebarUserCard isAuthenticated={isAuthenticated} />
          </div>
        </aside>
        <div id="mainAppShell" className="relative flex h-[100dvh] min-h-0 w-full max-w-xl flex-col border-x border-border bg-background transition-colors duration-150">
          {!isComposePage ? <MobileHeader /> : null}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden no-scrollbar">{children}</main>
          <FloatingComposeButton />
          <MiniPlayer />
          {!isPostPage ? <BottomNavigation isAuthenticated={isAuthenticated} /> : null}
        </div>
        <aside className="hidden h-screen w-72 shrink-0 flex-col justify-between gap-4 overflow-y-auto border-r border-border bg-background p-4 lg:flex">
          <div className="rounded-card border border-border bg-card p-3.5 text-xs text-card-foreground shadow-xs">
            <h2 className="font-black">ترندهای داغ میادین</h2>
            <p className="mt-2 text-muted-foreground">نمای مشترک اطلاعات و روندهای میدانی</p>
          </div>
          {/* Both sidebar footers share the same wrapper and a 3.375rem control,
              so the two columns end at exactly the same height. */}
          <div className="border-t border-divider pt-4">
            <ThemeSwitcher />
          </div>
        </aside>
      </div>
    </UnreadProvider>
  );
}
