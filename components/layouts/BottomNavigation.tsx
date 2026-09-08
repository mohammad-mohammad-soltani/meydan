"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Home, Map, MessageSquare, UserCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { NavigationSkeleton } from "./NavigationSkeleton";
import { useRouteTransition } from "./RouteTransitionProvider";

const items = [
  { href: "/home", label: "خانه", icon: Home, match: (path: string) => path === "/home" },
  { href: "/content", label: "محتوا", icon: FolderKanban, match: (path: string) => path === "/content" },
  { href: "/map", label: "نقشه زنده", icon: Map, match: (path: string) => path === "/map" },
  { href: "/chat", label: "گفتگو", icon: MessageSquare, match: (path: string) => path === "/chat" || path.startsWith("/chat/") },
  { href: "/profile", label: "هویت و پایگاه", icon: UserCheck, match: (path: string) => path === "/profile" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isTransitioning, pendingPath } = useRouteTransition();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const isConversationRoute = pathname.startsWith("/chat/");

  useEffect(() => {
    items.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  useEffect(() => {
    if (!pendingPath) {
      setShowSkeleton(false);
      return;
    }

    const timer = window.setTimeout(() => setShowSkeleton(true), 260);
    return () => window.clearTimeout(timer);
  }, [pendingPath]);

  if (isConversationRoute) return null;

  return (
    <nav id="bottomNavBar" aria-label="ناوبری اصلی" className="fixed bottom-0 z-50 grid w-full max-w-xl grid-cols-5 items-center gap-1.5 border-t border-slate-200 bg-white/95 px-3 py-2 text-slate-400 backdrop-blur dark:border-slate-800 dark:bg-[#070a0f]/95 lg:hidden">
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = pendingPath ? href === pendingPath : match(pathname);
        return <Link key={href} href={href} prefetch onClick={(event) => { if (active || isTransitioning) event.preventDefault(); }} aria-current={active ? "page" : undefined} className={`bottom-nav-item flex w-full min-w-0 flex-col items-center gap-1 px-1 py-1 font-bold ${active ? "bottom-nav-item-active text-brand-red" : "text-slate-500 dark:text-slate-400"}`}><Icon className="h-5 w-5 shrink-0" /><span className="whitespace-nowrap text-[9px]">{label}</span></Link>;
      })}
      {showSkeleton ? <NavigationSkeleton className="pointer-events-none fixed inset-x-0 top-[4rem] bottom-[4.5rem] z-40" /> : null}
    </nav>
  );
}
