"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpLeft,
  Bell,
  FolderKanban,
  Image,
  LayoutDashboard,
  Map,
  Menu,
  Megaphone,
  Mic,
  Newspaper,
  PencilLine,
  Sparkles,
  UserCheck,
  UsersRound,
  BadgeCheck,
  X,
  BarChart3,
  CalendarDays,
  ListFilter,
  Search,
  ChevronLeft,
} from "lucide-react";
import { ThemeMenu } from "@/components/layouts/ThemeMenu";
import { ThemeSwitcher } from "@/components/layouts/ThemeSwitcher";

type Section = { href: string; label: string; icon: typeof LayoutDashboard };
const SECTIONS: Section[] = [
  { href: "/admin", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/admin/squares", label: "میادین", icon: Map },
  { href: "/admin/squares/map", label: "نقشه میادین", icon: Map },
  { href: "/admin/speakers", label: "سخنرانان", icon: Mic },
  { href: "/admin/users", label: "کاربران", icon: UsersRound },
  {
    href: "/admin/speaker-requests",
    label: "درخواست‌های سخنرانی",
    icon: UserCheck,
  },
  {
    href: "/admin/speaker-invitations",
    label: "دعوت‌نامه‌ها",
    icon: Megaphone,
  },
  { href: "/admin/content", label: "بسته محتوا", icon: FolderKanban },
  { href: "/admin/report-days", label: "گزارش", icon: CalendarDays },
  { href: "/admin/creators", label: "تولیدکنندگان", icon: Sparkles },
  { href: "/admin/media-outlets", label: "رسانه‌ها", icon: Image },
  { href: "/admin/narratives", label: "کارگاه روایت", icon: PencilLine },
  { href: "/admin/initiatives", label: "ابتکارها", icon: BarChart3 },
  { href: "/admin/campaigns", label: "کمپین‌ها", icon: Newspaper },
  { href: "/admin/notifications", label: "اعلان گروهی", icon: Bell },
  { href: "/admin/officials", label: "رسمی‌ها", icon: BadgeCheck },
  { href: "/admin/feed", label: "فید", icon: ListFilter },
  { href: "/admin/content/banners", label: "بنرها", icon: Image },
];

const GROUPS = [
  { label: "میز کار", items: [SECTIONS[0], SECTIONS[5], SECTIONS[6]] },
  {
    label: "افراد و میادین",
    items: [SECTIONS[1], SECTIONS[2], SECTIONS[3], SECTIONS[4], SECTIONS[8], SECTIONS[14], SECTIONS[15]],
  },
  { label: "محتوا", items: [SECTIONS[7], SECTIONS[17]] },
  { label: "محتوا و رسانه", items: [SECTIONS[8], SECTIONS[10], SECTIONS[11]] },
  {
    label: "برنامه‌ها و ارتباطات",
    items: [SECTIONS[11], SECTIONS[12], SECTIONS[13]],
  },
];

function activeHref(pathname: string) {
  return SECTIONS.filter((section) =>
    section.href === "/admin"
      ? pathname === "/admin"
      : pathname === section.href || pathname.startsWith(`${section.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function SectionLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = activeHref(pathname);
  const [query, setQuery] = useState("");
  const normalize = (text: string) =>
    text
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/\u200c/g, " ")
      .trim();
  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      normalize(item.label).includes(normalize(query)),
    ),
  })).filter((group) => group.items.length);
  return (
    <nav
      aria-label="بخش‌های پنل مدیریت"
      className="admin-section-links space-y-5"
    >
      <label className="admin-nav-search">
        <Search size={16} aria-hidden="true" />
        <input
          aria-label="جست‌وجو در بخش‌های مدیریت"
          placeholder="پیدا کردن بخش…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            type="button"
            aria-label="پاک کردن جست‌وجو"
            onClick={() => setQuery("")}
          >
            <X size={14} />
          </button>
        )}
      </label>
      {groups.length === 0 && (
        <p className="px-3 text-xs leading-6 text-muted-foreground">
          بخشی با این نام پیدا نشد.
        </p>
      )}
      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-2 px-3 text-[11px] font-black text-muted-foreground">
            {group.label}
          </h2>
          <ul className="space-y-1">
            {group.items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href as Route}
                  onClick={onNavigate}
                  aria-current={href === active ? "page" : undefined}
                  className={`admin-nav-item flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${href === active ? "bg-selected text-selected-foreground" : "text-foreground-secondary hover:bg-hover hover:text-foreground"}`}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-[18px] w-[18px] shrink-0"
                  />
                  <span className="min-w-0 flex-1">{label}</span>
                  {href === active && (
                    <ChevronLeft size={14} aria-hidden="true" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSectionNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const current = SECTIONS.find(
    (section) => section.href === activeHref(pathname),
  );

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    const trigger = triggerRef.current;
    if (!drawer) return;
    drawer.showModal();
    return () => {
      if (drawer.open) drawer.close();
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="admin-navigation sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-divider bg-surface-glass px-4 backdrop-blur lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="باز کردن فهرست پنل"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-control border border-border bg-surface text-foreground"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-muted-foreground">
            پنل مدیریت
          </span>
          <strong className="block truncate text-sm font-black text-foreground">
            {current?.label ?? "مدیریت میدان"}
          </strong>
        </div>
        <ThemeMenu />
      </header>

      <aside className="admin-sidebar admin-navigation hidden w-72 shrink-0 flex-col border-l border-divider bg-surface lg:fixed lg:inset-y-0 lg:right-0 lg:z-20 lg:flex lg:h-screen">
        <div className="admin-sidebar-brand border-b border-divider px-5 py-5">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-lg font-black text-brand-foreground">
              م
            </span>
            <span>
              <strong className="block text-base font-black text-foreground">
                مدیریت میدان
              </strong>
              <span className="text-xs text-muted-foreground">
                فضای مدیریت و راهبری
              </span>
            </span>
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <SectionLinks pathname={pathname} />
        </div>
        <div className="space-y-3 border-t border-divider p-4">
          <ThemeSwitcher />
          <Link
            href="/home"
            className="flex min-h-11 items-center justify-center gap-2 rounded-control border border-border text-xs font-bold text-foreground-secondary hover:bg-hover"
          >
            <ArrowUpLeft aria-hidden="true" className="h-4 w-4" /> بازگشت به
            برنامه
          </Link>
        </div>
      </aside>

      <dialog
        ref={drawerRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === drawerRef.current) setOpen(false);
        }}
        aria-label="فهرست پنل مدیریت"
        className="admin-nav-dialog m-0 ml-auto h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none border-0 border-l border-divider bg-surface p-0 text-foreground lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-divider px-4 py-3">
            <strong className="text-base font-black">بخش‌های مدیریت</strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن فهرست"
              className="grid h-11 w-11 place-items-center rounded-control hover:bg-hover"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            <SectionLinks
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </div>
          <div className="border-t border-divider p-4">
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-bold text-foreground-secondary hover:bg-hover"
            >
              <ArrowUpLeft aria-hidden="true" className="h-4 w-4" /> بازگشت به
              برنامه
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}

export { SECTIONS as ADMIN_SECTIONS };
export const ADMIN_SECTION_HREFS = SECTIONS.map((section) => section.href);
