"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeMenu } from "./ThemeMenu";

export function MobileHeader() {
  const pathname = usePathname();
  const isConversationRoute = pathname.startsWith("/chat/");
  const isContentDetailRoute = pathname.startsWith("/content/");
  const isPostRoute = pathname.startsWith("/posts/");
  const isExploreRoute = pathname === "/explore";
  const isProfileRoute = pathname === "/profile" || pathname.startsWith("/profile/");
  const isInitiativeRoute = pathname.startsWith("/initiatives/");

  if (pathname === "/chat" || isConversationRoute || isContentDetailRoute || isPostRoute || isExploreRoute || isProfileRoute || isInitiativeRoute) return null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface-glass px-4 py-3 backdrop-blur-md lg:hidden">
      <Link href="/home" className="flex min-w-0 items-center gap-2.5" aria-label="خانه میدان خیابان">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-black text-brand-foreground">م</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black leading-tight text-foreground">میدانِ خیابان</span>
          <span className="block truncate text-[10px] text-muted-foreground">شبکه همبستگی و روایت میادین ایران</span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeMenu />
      </div>
    </header>
  );
}
