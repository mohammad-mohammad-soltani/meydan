"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, Search, Sun, X } from "lucide-react";

const searchCatalog = [
  "پایگاه میدان انقلاب تهران",
  "میدان امیرچخماق یزد",
  "حاج میثم مطیعی",
  "حجت‌الاسلام مهدی ماندگاری",
  "روایت میدان انقلاب",
];

export function MobileHeader() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isConversationRoute = pathname.startsWith("/chat/");
  const isContentDetailRoute = pathname.startsWith("/content/");
  const isPostRoute = pathname.startsWith("/posts/");

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa-IR");
    return normalized ? searchCatalog.filter((item) => item.toLocaleLowerCase("fa-IR").includes(normalized)) : [];
  }, [query]);

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

  if (pathname === "/chat" || isConversationRoute || isContentDetailRoute || isPostRoute) return null;

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
        <button type="button" onClick={() => setIsSearchOpen(true)} aria-label="جستجو" className="flex min-h-11 items-center gap-1.5 rounded-control border border-border bg-surface-muted px-3 py-2 text-foreground-secondary transition-colors hover:bg-hover hover:text-brand">
          <span className="whitespace-nowrap text-xs font-bold">جستجو</span>
          <Search className="h-4 w-4" />
        </button>
        <button type="button" onClick={toggleTheme} aria-label={isDark ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تیره"} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface-muted text-icon transition-colors hover:bg-hover hover:text-warning">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {isSearchOpen ? (
        <div role="dialog" aria-modal="true" aria-label="جستجو در میادین" className="fixed inset-0 z-50 flex items-start justify-center bg-overlay p-4 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-3 rounded-panel border border-border bg-popover p-4 text-popover-foreground shadow-dialog">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-black"><Search className="h-4 w-4 text-brand" />جستجو در میدان</h2>
              <button type="button" onClick={() => setIsSearchOpen(false)} aria-label="بستن جستجو" className="grid h-10 w-10 place-items-center rounded-control text-icon-muted transition-colors hover:bg-hover hover:text-brand"><X className="h-5 w-5" /></button>
            </div>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="نام میدان، شهر یا سخنران"
              className="min-h-11 w-full rounded-control border border-input-border bg-input px-3 py-2.5 text-xs text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="max-h-56 space-y-2 overflow-auto no-scrollbar">
              {query.trim() ? (
                results.length ? results.map((result) => <p key={result} className="rounded-control border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground">{result}</p>) : <p className="text-xs text-muted-foreground">نتیجه‌ای پیدا نشد.</p>
              ) : <p className="text-xs text-muted-foreground">نام میدان، شهر یا سخنران را وارد کنید.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
