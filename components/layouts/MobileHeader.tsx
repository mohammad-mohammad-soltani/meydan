"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, Search, Sun } from "lucide-react";

export function MobileHeader() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const isConversationRoute = pathname.startsWith("/chat/");
  const isContentDetailRoute = pathname.startsWith("/content/");
  const isPostRoute = pathname.startsWith("/posts/");
  const isExploreRoute = pathname === "/explore";

  useEffect(() => {
    const saved = window.localStorage.getItem("meydan-theme");
    const dark = saved !== "light";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    queueMicrotask(() => setIsDark(dark));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    window.localStorage.setItem("meydan-theme", next ? "dark" : "light");
    setIsDark(next);
  };

  if (pathname === "/chat" || isConversationRoute || isContentDetailRoute || isPostRoute || isExploreRoute) return null;

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
        <Link href="/explore" aria-label="جستجو" className="flex min-h-11 items-center gap-1.5 rounded-control border border-border bg-surface-muted px-3 py-2 text-foreground-secondary transition-colors hover:bg-hover hover:text-brand">
          <span className="whitespace-nowrap text-xs font-bold">جستجو</span>
          <Search className="h-4 w-4" />
        </Link>
        <button type="button" onClick={toggleTheme} aria-label={isDark ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تیره"} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface-muted text-icon transition-colors hover:bg-hover hover:text-warning">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
