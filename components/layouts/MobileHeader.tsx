"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, Search, Sun } from "lucide-react";
import { useSearchModal } from "@/components/providers/SearchProvider";

export function MobileHeader() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const { openSearch } = useSearchModal();
  const isConversationRoute = pathname.startsWith("/chat/");

  useEffect(() => {
    const saved = window.localStorage.getItem("meydan-theme");
    const dark = saved !== "light";
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("meydan-theme", next ? "dark" : "light");
    setIsDark(next);
  };

  if (isConversationRoute) return null;

  return (
    <header className="mobile-app-header sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-[#070a0f]/95 lg:hidden">
      <Link href="/home" className="flex min-w-0 items-center gap-2.5" aria-label="خانه میدان خیابان">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-black text-white">م</span>
        <span className="min-w-0"><span className="block truncate text-sm font-black leading-tight text-slate-900 dark:text-white">میدانِ خیابان</span><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">شبکه همبستگی و روایت میادین ایران</span></span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={openSearch} aria-label="جستجو" className="header-search-control flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600 transition hover:text-brand-red dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><span className="whitespace-nowrap text-xs font-bold">جستجو</span><Search className="h-4 w-4" /></button>
        <button type="button" onClick={toggleTheme} aria-label={isDark ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تیره"} className="header-theme-control rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-600 transition hover:text-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-amber-400">{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
      </div>
    </header>
  );
}
