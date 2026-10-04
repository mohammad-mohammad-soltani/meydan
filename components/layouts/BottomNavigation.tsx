"use client";

import Link from "next/link";
import type { Route } from "next";
import { Compass, FolderKanban, Home, LogIn, MessageCircle, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavBadge } from "./NavBadge";
import styles from "./shell.module.css";

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
  { href: "/content", label: "محتوا", icon: FolderKanban, match: (path: string) => path === "/content" },
  { href: "/map", label: "نقشه زنده", icon: Compass, match: (path: string) => path === "/map" },
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
    ? [...items, { href: "/profile", label: "نمایه", icon: UserRound, match: (path: string) => path === "/profile" }]
    : [
        ...items,
        {
          href: "/auth",
          label: "ورود",
          icon: LogIn,
          match: (path: string) => path === "/auth" || path.startsWith("/auth/"),
        },
      ];

    return (
    <nav
      id="bottomNavBar"
      aria-label="ناوبری اصلی"
      className={`${styles.bottom} absolute inset-x-0 bottom-0 z-50 flex w-full items-center justify-around px-2 lg:hidden`}
    >
      {links.map(({ href, label, icon: Icon, match, badge }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href as Route}
            aria-current={active ? "page" : undefined}
            className={`relative z-10 flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 px-3 py-1 transition-colors ${active ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="relative">
              {active && Icon === Home ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
              ) : (
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              )}
              {badge ? <NavBadge dot className="absolute -right-1.5 -top-0.5" /> : null}
            </span>
            <span className="whitespace-nowrap text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
