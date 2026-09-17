"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  FolderKanban,
  Image,
  LayoutDashboard,
  Map,
  Megaphone,
  Mic,
  Newspaper,
  PencilLine,
  Sparkles,
  UserCheck,
} from "lucide-react";

type Section = { href: string; label: string; icon: typeof LayoutDashboard };
const SECTIONS: Section[] = [
  { href: "/admin", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/admin/squares", label: "میادین", icon: Map },
  { href: "/admin/squares/map", label: "نقشه میادین", icon: Map },
  { href: "/admin/speakers", label: "سخنرانان", icon: Mic },
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
  { href: "/admin/creators", label: "تولیدکنندگان", icon: Sparkles },
  { href: "/admin/media-outlets", label: "رسانه‌ها", icon: Image },
  { href: "/admin/narratives", label: "کارگاه روایت", icon: PencilLine },
  { href: "/admin/initiatives", label: "ابتکارها", icon: BarChart3 },
  { href: "/admin/campaigns", label: "کمپین‌ها", icon: Newspaper },
  { href: "/admin/notifications", label: "اعلان گروهی", icon: Bell },
];
const GROUPS = [
  { label: "عملیات اصلی", items: SECTIONS.slice(0, 6) },
  { label: "محتوا و رسانه", items: SECTIONS.slice(6, 10) },
  { label: "مدیریت سیستم", items: SECTIONS.slice(10) },
];
function resolveActive(pathname: string) {
  return (
    SECTIONS.filter((section) =>
      section.href === "/admin"
        ? pathname === "/admin"
        : pathname === section.href || pathname.startsWith(`${section.href}/`),
    ).sort((a, b) => b.href.length - a.href.length)[0]?.href ?? ""
  );
}

export function AdminSectionNav() {
  const active = resolveActive(usePathname());
  return (
    <nav
      aria-label="بخش‌های پنل مدیریت"
      className="admin-navigation border-b border-divider bg-surface-elevated lg:fixed lg:inset-y-0 lg:right-0 lg:z-20 lg:flex lg:w-72 lg:flex-col lg:border-b-0 lg:border-l"
    >
      <div className="flex items-center border-b border-divider px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-lg font-black text-brand-foreground">
            م
          </span>
          <span>
            <strong className="block text-sm font-black text-foreground">
              پنل مدیریت
            </strong>
            <span className="text-[10px] text-muted-foreground">
              میدان · مرکز عملیات
            </span>
          </span>
        </Link>
      </div>
      <div className="overflow-x-auto px-3 py-3 lg:overflow-y-auto lg:px-4 lg:py-5">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-black tracking-wide text-foreground-subtle">
              {group.label}
            </p>
            <ul className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
              {group.items.map((section) => {
                const current = section.href === active;
                const Icon = section.icon;
                return (
                  <li key={section.href}>
                    <Link
                      href={section.href as Route}
                      aria-current={current ? "page" : undefined}
                      title={section.label}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-bold transition-colors lg:w-full ${current ? "bg-selected text-selected-foreground shadow-sm" : "text-foreground-secondary hover:bg-hover hover:text-foreground"}`}
                    >
                      <Icon
                        aria-hidden="true"
                        className="h-[18px] w-[18px] shrink-0"
                      />
                      <span className="whitespace-nowrap">{section.label}</span>
                      {current ? (
                        <span className="ms-auto hidden h-1.5 w-1.5 rounded-full bg-brand lg:block" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
export { SECTIONS as ADMIN_SECTIONS };
export const ADMIN_SECTION_HREFS = SECTIONS.map((section) => section.href);
