"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function MobileHeader() {
  const [isDark, setIsDark] = useState(true);

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

  return (
    <header className="mobile-app-header sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-[#070a0f]/95 lg:hidden">
      <Link href="/home" className="flex items-center gap-2.5" aria-label="خانه میدان خیابان">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-sm font-black text-white">م</span>
        <span><span className="block text-sm font-black leading-tight text-slate-900 dark:text-white">میدانِ خیابان</span><span className="block text-[10px] text-slate-500 dark:text-slate-400">شبکه همبستگی و روایت میادین ایران</span></span>
      </Link>
      <button type="button" onClick={toggleTheme} aria-label={isDark ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تیره"} className="rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-600 transition hover:text-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-amber-400">
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </header>
  );
}
