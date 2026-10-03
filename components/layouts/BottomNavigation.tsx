"use client";

import Link from "next/link";
import type { Route } from "next";
import { Compass, FolderKanban, Home, LogIn, MessageCircle, UserCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavBadge } from "./NavBadge";

type NavLink = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
  /** Show the unread counter. */
  badge?: boolean;
};

// Explore moved to the mobile header, so chat takes its slot here.
const items: NavLink[] = [
  { href: "/home", label: "خانه", icon: Home, match: (path: string) => path === "/home" },
  { href: "/map", label: "نقشه زنده", icon: Compass, match: (path: string) => path === "/map" },
  { href: "/content", label: "محتوا", icon: FolderKanban, match: (path: string) => path === "/content" },
  {
    href: "/chat",
    label: "گفتگو",
    icon: MessageCircle,
    match: (path: string) => path === "/chat" || path.startsWith("/chat/"),
    badge: true,
  },
];

type BottomNavigationProps = { isAuthenticated?: boolean };

export function BottomNavigation({ isAuthenticated = false }: BottomNavigationProps) {
  const pathname = usePathname();
  const isConversationRoute = pathname.startsWith("/chat/");

  if (isConversationRoute) return null;

  const links: NavLink[] = isAuthenticated
    ? [...items, { href: "/profile", label: "نمایه", icon: UserCheck, match: (path: string) => path === "/profile" }]
    : [
        ...items,
        {
          href: "/auth",
          label: "ورود",
          icon: LogIn,
          match: (path: string) => path === "/auth" || path.startsWith("/auth/"),
        },
      ];

  const activeIndex = links.findIndex(({ match }) => match(pathname));

  return (
    <nav
      id="bottomNavBar"
      aria-label="ناوبری اصلی"
      className="relative z-50 grid w-full shrink-0 grid-cols-5 items-center gap-1.5 border-t border-border bg-surface-glass px-3 py-2 pb-[max(.5rem,env(safe-area-inset-bottom))] text-icon-muted backdrop-blur lg:hidden"
    >
      <span
        aria-hidden
        className="nav-indicator-pill pointer-events-none absolute inset-y-1.5 z-0 rounded-xl bg-brand-muted"
        style={{
          // Nav padding is px-3 (0.75rem/side) and columns are separated by
          // gap-1.5 (0.375rem) × 4 gaps — both must come out of 100% before
          // dividing into five equal tracks, or the pill drifts off-column.
          width: "calc((100% - 3rem) / 5)",
          insetInlineStart: `calc(0.75rem + ${Math.max(activeIndex, 0)} * ((100% - 3rem) / 5 + 0.375rem))`,
          opacity: activeIndex === -1 ? 0 : 1,
        }}
      />
      {links.map(({ href, label, icon: Icon, match, badge }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href as Route}
            aria-current={active ? "page" : undefined}
            className={`relative z-10 flex min-h-11 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 font-bold transition-colors ${active ? "text-brand" : "text-muted-foreground hover:bg-hover hover:text-foreground"}`}
          >
            <span className="relative">
              <Icon className="h-5 w-5 shrink-0" />
              {badge ? <NavBadge className="absolute -right-3 -top-2" /> : null}
            </span>
            <span className="whitespace-nowrap text-[9px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
