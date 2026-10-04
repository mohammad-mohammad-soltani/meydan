"use client";

import Link from "next/link";
import type { Route } from "next";
import { Compass, FolderKanban, Home, LogIn, MessageCircle, UserRound } from "lucide-react";
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
      className="relative z-50 grid w-full shrink-0 grid-cols-5 items-center gap-1.5 bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-3 py-2 pb-[max(.5rem,env(safe-area-inset-bottom))] text-icon-muted shadow-[0_-10px_28px_-14px_rgba(0,0,0,.45),0_-1px_0_color-mix(in_srgb,var(--foreground)_7%,transparent)] backdrop-blur-[24px] backdrop-saturate-[1.7] lg:hidden"
    >
      {links.map(({ href, label, icon: Icon, match, badge }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href as Route}
            aria-current={active ? "page" : undefined}
            className={`relative z-10 flex min-h-11 w-full min-w-0 flex-col items-center justify-center gap-1 px-1 py-1 transition-colors ${active ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="relative">
              <Icon className={`h-5 w-5 shrink-0 ${active && Icon === Home ? "fill-current" : ""}`} />
              {badge ? <NavBadge dot className="absolute -right-1.5 -top-0.5" /> : null}
            </span>
            <span className="whitespace-nowrap text-[10.5px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
