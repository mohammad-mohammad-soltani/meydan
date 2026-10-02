"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  FileText,
  Home,
  LogIn,
  Newspaper,
  Plus,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { DrawerViewer } from "./useDrawerViewer";
import { ThemeSwitcher } from "./ThemeSwitcher";

type Item = { href: string; label: string; icon: LucideIcon; active: (path: string, filter: string | null) => boolean };

const ITEMS: Item[] = [
  { href: "/home", label: "خانه", icon: Home, active: (p, f) => p === "/home" && !f },
  { href: "/profile", label: "نمایه", icon: UserRound, active: (p) => p === "/profile" },
  { href: "/home?filter=narratives", label: "روایت‌های مردمی", icon: FileText, active: (p, f) => p === "/home" && f === "narratives" },
  { href: "/home?filter=initiatives", label: "کار و اقدام میدانی", icon: Sparkles, active: (p, f) => p === "/home" && f === "initiatives" },
  { href: "/home?filter=reflected", label: "پویش‌های رسانه‌ای", icon: Newspaper, active: (p, f) => p === "/home" && f === "reflected" },
  { href: "/bookmarks", label: "نشان‌شده‌ها", icon: Bookmark, active: (p) => p === "/bookmarks" },
  { href: "/compose", label: "ثبت روایت یا پویش جدید", icon: Plus, active: () => false },
];

const compact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });

/**
 * The mobile side menu opened from the header avatar: identity, follower
 * counts, the main sections and the theme switch. Its data comes from the
 * shared `/me` read, so opening it costs no request.
 */
export function MobileDrawer({
  open,
  onClose,
  viewer,
  isAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  viewer: DrawerViewer | null;
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();
  const filter = useSearchParams().get("filter");
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);

  // Close on navigation, Escape, and lock the page behind it while open.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only route changes should close it
  }, [pathname, filter]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={`fixed inset-0 z-[70] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="بستن منو"
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="منوی اصلی"
        tabIndex={-1}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          // RTL panel on the right: a swipe toward the edge closes it.
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start !== null && end !== undefined && end - start > 70) onClose();
        }}
        className={`absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-hidden rounded-l-3xl border-l border-border bg-background outline-none transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="relative h-36 shrink-0 overflow-hidden bg-gradient-to-b from-surface-elevated to-background">
          {viewer?.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote cover of any size
            <img src={viewer.coverUrl} alt="" className="h-full w-full object-cover opacity-70" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-glass text-foreground backdrop-blur"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="-mt-14 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4">
          {isAuthenticated && viewer ? (
            <>
              <span className="relative block h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-surface-muted">
                {viewer.avatarUrl ? (
                  <OptimizedAvatar src={viewer.avatarUrl} alt="" width={80} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-2xl font-black text-foreground">{viewer.name.charAt(0)}</span>
                )}
              </span>
              <p className="mt-3 flex items-center gap-1.5 text-lg font-black text-foreground">
                {viewer.name}
                <AccountBadges verified={viewer.verified} kind={viewer.kind} size="md" />
              </p>
              {viewer.handle ? <p className="mt-0.5 text-xs text-muted-foreground latin-digits" dir="ltr">@{viewer.handle}</p> : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { value: viewer.followers, label: "دنبال‌کننده" },
                  { value: viewer.following, label: "دنبال‌شده" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-surface-muted px-3 py-2.5 text-center">
                    <strong className="block text-base font-black text-foreground">{compact.format(stat.value)}</strong>
                    <span className="block text-[10px] text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="pt-16">
              <Link
                href="/auth"
                className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emphasis text-sm font-black text-emphasis-foreground"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                ورود یا ثبت‌نام
              </Link>
            </div>
          )}

          <nav aria-label="منوی اصلی" className="mt-5 space-y-1">
            {ITEMS.filter((item) => isAuthenticated || (item.href !== "/profile" && item.href !== "/bookmarks" && item.href !== "/compose")).map(
              ({ href, label, icon: Icon, active }) => {
                const isActive = active(pathname, filter);
                return (
                  <Link
                    key={href}
                    href={href as Route}
                    aria-current={isActive ? "page" : undefined}
                    className="flex items-center gap-3 rounded-2xl px-1 py-1.5 text-sm font-black text-foreground transition-colors hover:bg-hover"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                        isActive ? "border-transparent bg-emphasis text-emphasis-foreground" : "border-border bg-surface-muted text-icon"
                      }`}
                    >
                      <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                    </span>
                    {label}
                  </Link>
                );
              },
            )}
          </nav>
        </div>

        <div className="shrink-0 border-t border-divider px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 text-[11px] font-bold text-muted-foreground">پوسته و رنگ برنامه</p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>,
    document.body,
  );
}
