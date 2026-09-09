"use client";

import Link from "next/link";
import type { Route } from "next";
import { FolderKanban, Home, Map, Search, UserCheck } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "خانه", icon: Home, match: (path: string) => path === "/home" },
  { href: "/content", label: "محتوا", icon: FolderKanban, match: (path: string) => path === "/content" },
  { href: "/map", label: "نقشه زنده", icon: Map, match: (path: string) => path === "/map" },
  { href: "/explore", label: "کاوش", icon: Search, match: (path: string) => path === "/explore" },
  { href: "/profile", label: "هویت و پایگاه", icon: UserCheck, match: (path: string) => path === "/profile" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const isConversationRoute = pathname.startsWith("/chat/");

  if (isConversationRoute) return null;

  return (
    <nav
      id="bottomNavBar"
      aria-label="ناوبری اصلی"
      className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-xl -translate-x-1/2 grid-cols-5 items-center gap-1.5 border-t border-border bg-surface-glass px-3 py-2 pb-[max(.5rem,env(safe-area-inset-bottom))] text-icon-muted backdrop-blur lg:hidden"
    >
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href as Route}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 font-bold transition-colors ${active ? "bg-brand-muted text-brand" : "text-muted-foreground hover:bg-hover hover:text-foreground"}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap text-[9px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
