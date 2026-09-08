"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FolderKanban, Home, Map, MessageSquare, UserCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { NavigationSkeleton } from "./NavigationSkeleton";

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
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const skeletonTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const isConversationRoute = pathname.startsWith("/chat/");

  const clearNavigationFeedback = useCallback(() => {
    if (skeletonTimerRef.current) window.clearTimeout(skeletonTimerRef.current);
    if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    skeletonTimerRef.current = null;
    fallbackTimerRef.current = null;
    setShowSkeleton(false);
    setPendingHref(null);
  }, []);

  useEffect(() => {
    items.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  useEffect(() => {
    if (pendingHref && pathname === pendingHref) clearNavigationFeedback();
  }, [pathname, pendingHref, clearNavigationFeedback]);

  useEffect(() => () => {
    if (skeletonTimerRef.current) window.clearTimeout(skeletonTimerRef.current);
    if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
  }, []);

  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>, href: string, active: boolean) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    if (active || pendingHref) {
      event.preventDefault();
      return;
    }

    // The selected control reacts immediately; the skeleton appears only when the route is slow.
    setPendingHref(href);
    setShowSkeleton(false);
    skeletonTimerRef.current = window.setTimeout(() => setShowSkeleton(true), 120);
    fallbackTimerRef.current = window.setTimeout(clearNavigationFeedback, 5000);
  };

  if (isConversationRoute) return null;

  return (
    <nav id="bottomNavBar" aria-label="ناوبری اصلی" className="fixed bottom-0 z-50 grid w-full max-w-xl grid-cols-5 items-center gap-1.5 border-t border-slate-200 bg-white/95 px-3 py-2 text-slate-400 backdrop-blur dark:border-slate-800 dark:bg-[#070a0f]/95 lg:hidden">
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = pendingHref ? href === pendingHref : match(pathname);
        return <Link key={href} href={href} prefetch onClick={(event) => handleNavigate(event, href, active)} aria-current={active ? "page" : undefined} className={`bottom-nav-item flex w-full min-w-0 flex-col items-center gap-1 px-1 py-1 font-bold ${active ? "bottom-nav-item-active text-brand-red" : "text-slate-500 dark:text-slate-400"}`}><Icon className="h-5 w-5 shrink-0" /><span className="whitespace-nowrap text-[9px]">{label}</span></Link>;
      })}
      {showSkeleton ? <NavigationSkeleton className="pointer-events-none fixed inset-x-0 top-[4rem] bottom-[4.5rem] z-40" /> : null}
    </nav>
  );
}
