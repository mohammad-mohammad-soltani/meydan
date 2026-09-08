"use client";

import Link from "next/link";
import { FolderKanban, Home, Map, MessageSquare, UserCheck } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "خانه", icon: Home, match: (path: string) => path === "/home" },
  { href: "/content", label: "محتوا", icon: FolderKanban, match: (path: string) => path === "/content" },
  { href: "/map", label: "نقشه زنده", icon: Map, match: (path: string) => path === "/map" },
  { href: "/chat", label: "گفتگو", icon: MessageSquare, match: (path: string) => path === "/chat" || path.startsWith("/chat/") },
  { href: "/profile", label: "هویت و پایگاه", icon: UserCheck, match: (path: string) => path === "/profile" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const isConversationRoute = pathname.startsWith("/chat/");

  if (isConversationRoute) return null;

  return (
    <nav id="bottomNavBar" aria-label="ناوبری اصلی" className="fixed bottom-0 z-50 flex w-full max-w-xl items-center justify-between border-t border-slate-200 bg-white/95 px-3 py-2 text-slate-400 backdrop-blur dark:border-slate-800 dark:bg-[#070a0f]/95 lg:hidden">
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1 font-bold transition ${active ? "nav-active bg-red-500/10 text-brand-red" : "text-slate-500 dark:text-slate-400"}`}><Icon className="h-5 w-5" /><span className="text-[9px]">{label}</span></Link>;
      })}
    </nav>
  );
}
