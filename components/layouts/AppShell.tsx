"use client";

import { isPublicProfilePath } from "@/lib/profile-route";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Home,
  LogIn,
  Map,
  MessageCircle,
  Mic,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { MiniPlayer } from "@/features/audio/MiniPlayer";
import { AdminNavLink } from "@/components/layouts/AdminNavLink";
import { AppLogo } from "@/components/shared/AppLogo";
import { SilentBoundary } from "@/components/shared/SilentBoundary";
import { PushEnrollment } from "@/components/pwa/PushEnrollment";
import { HotTrendsPanel } from "@/features/trends/components/HotTrendsPanel";
import { PostLoginReturn } from "@/components/providers/AuthReturnToBridge";
import { UnreadProvider } from "@/features/chat/providers/UnreadProvider";
import { BottomNavigation } from "./BottomNavigation";
import { DesktopNavIndicator } from "./DesktopNavIndicator";
import { FloatingComposeButton } from "./FloatingComposeButton";
import { MobileHeader } from "./MobileHeader";
import { NavBadge } from "./NavBadge";
import { SidebarUserCard } from "./SidebarUserCard";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: ReactNode;
  isAuthenticated?: boolean;
  isNativeClient?: boolean;
};

const desktopLinkClass =
  "relative z-10 flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-bold transition-colors";
// One text color per state: with both in the class list the stylesheet order,
// not the intent, decided which one won.
const idleDesktopLinkClass = "text-foreground-secondary hover:bg-hover hover:text-foreground";
const activeDesktopLinkClass = "text-emphasis-foreground";

function desktopLink(pathname: string, href: string) {
  const active = pathname === href || pathname.startsWith(`${href}/`) ||
    (href === "/speakers" && pathname.startsWith("/speaker-invitations"));
  return {
    className: `${desktopLinkClass} ${active ? activeDesktopLinkClass : idleDesktopLinkClass}`,
    "aria-current": active ? "page" as const : undefined,
  };
}

export function AppShell({
  children,
  isAuthenticated = false,
  isNativeClient = false,
}: AppShellProps) {
  const pathname = usePathname();
  const mainScrollRef = useRef<HTMLElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const isPostPage = pathname.startsWith("/posts/");
  const isComposePage = pathname === "/compose";
  const isPublicProfilePage =
    pathname.startsWith("/users/") ||
    pathname.startsWith("/profile/") ||
    /^\/\d+$/.test(pathname) || pathname.startsWith("/square/") ||
    isPublicProfilePath(pathname);
    // Conversation routes own their internal scrolling (header + list + composer).
  // Chat is the two-pane workspace (conversations + work groups), laid out like the old «کارها» page.
  const isWorksRoute = pathname === "/chat" || pathname.startsWith("/chat/");
  const isChatRoute = isWorksRoute;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  // The app scrolls inside <main>, not window. Next.js cannot restore/reset this
  // custom scroll container automatically, so client-side navigation used to
  // carry the previous route's scrollTop into the next page (most visibly on
  // profile routes). Reset before paint so headers/nav never render mid-scroll.
  useLayoutEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    main.scrollTop = 0;
    main.scrollLeft = 0;
  }, [pathname]);

  return (
    <UnreadProvider isAuthenticated={isAuthenticated}>
      <div
        className={`mx-auto flex h-[100dvh] w-full justify-center overflow-hidden bg-background text-foreground lg:bg-surface-sunken ${isAdminRoute ? "admin-route" : ""} ${isWorksRoute ? "works-route" : ""}`}
      >
        <PostLoginReturn />
        <PushEnrollment isAuthenticated={isAuthenticated} />
        <aside className="hidden h-screen w-72 shrink-0 flex-col justify-between overflow-y-auto border-l border-divider bg-background p-4 lg:flex">
          <div className="space-y-6">
            <Link href="/home" className="flex items-center gap-3 px-2">
              <AppLogo priority />
              <span>
                <span className="flex items-center gap-1.5 text-base font-black text-foreground">
                  نقش من
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  شبکه سراسری میادین ایران
                </span>
              </span>
            </Link>
            <div className="space-y-5">
              <nav
                ref={desktopNavRef}
                aria-label="ناوبری دسکتاپ"
                className="relative space-y-1.5"
              >
                <DesktopNavIndicator containerRef={desktopNavRef} />
                <Link href="/home" {...desktopLink(pathname, "/home")}>
                  <Home className="h-5 w-5" />
                  خانه و روایت‌ها
                </Link>
                {isAuthenticated ? (
                  <Link href="/profile" {...desktopLink(pathname, "/profile")}>
                    <UserRound className="h-5 w-5" />
                    نمایه کاربری (پروفایل)
                  </Link>
                ) : (
                  <Link href="/auth" {...desktopLink(pathname, "/auth")}>
                    <LogIn className="h-5 w-5" />
                    ورود
                  </Link>
                )}
                <Link href="/content" {...desktopLink(pathname, "/content")}>
                  <FolderKanban className="h-5 w-5" />
                  بسته محتوا
                </Link>
                <Link href="/speakers" {...desktopLink(pathname, "/speakers")}>
                  <Mic className="h-5 w-5" />
                  اعزام سخنران
                </Link>
                <Link href="/map" {...desktopLink(pathname, "/map")}>
                  <Map className="h-5 w-5" />
                  نقشه زنده
                </Link>
                <Link href="/chat" {...desktopLink(pathname, "/chat")}>
                  <MessageCircle className="h-5 w-5" />
                  گفتگو
                  <NavBadge className="ms-auto" />
                </Link>
                <Link href="/explore" {...desktopLink(pathname, "/explore")}>
                  <Search className="h-5 w-5" />
                  کاوش و جستجو
                </Link>
                {isAuthenticated ? (
                  <AdminNavLink
                    isAuthenticated={isAuthenticated}
                    {...desktopLink(pathname, "/admin")}
                  />
                ) : null}
              </nav>
            </div>
          </div>
          <div className="border-t border-divider pt-3">
            <SidebarUserCard isAuthenticated={isAuthenticated} />
          </div>
        </aside>
        <div
          id="mainAppShell"
          className={`relative flex h-[100dvh] min-h-0 w-full flex-col border-x border-divider bg-background transition-colors duration-150 ${isAdminRoute ? "max-w-none" : "max-w-xl pb-[var(--comment-composer-height)]"}`}
        >
          {!isWorksRoute && !isAdminRoute && !isComposePage && !isPublicProfilePage ? (
            pathname === "/home" ? null : <MobileHeader />
          ) : null}
          <main
            ref={mainScrollRef}
            className={`relative z-0 flex min-h-0 flex-1 flex-col overflow-x-hidden no-scrollbar ${isAdminRoute || isWorksRoute || isChatRoute ? "overflow-hidden" : "overflow-y-auto"}`}
          >
            {pathname === "/home" ? <MobileHeader /> : null}
            {children}
          </main>
          {!isAdminRoute && !isWorksRoute ? (
            <>
              <FloatingComposeButton />
              <SilentBoundary label="mini-player">
                <MiniPlayer />
              </SilentBoundary>
            </>
          ) : null}
          {!isPostPage && !isComposePage && !isAdminRoute && !pathname.startsWith("/chat/") && (!isNativeClient || isAuthenticated) ? (
            <BottomNavigation isAuthenticated={isAuthenticated} />
          ) : null}
        </div>
        <aside className="hidden h-screen w-72 shrink-0 flex-col justify-between gap-4 overflow-y-auto border-r border-divider bg-background p-4 lg:flex">
          <div className="space-y-3">
            <SilentBoundary label="trends-panel">
              <HotTrendsPanel />
            </SilentBoundary>
            <section className="rounded-3xl border border-border bg-surface p-4">
              <h2 className="flex items-center gap-1.5 text-xs font-black text-foreground">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-icon" />
                شبکه همبستگی ایران
              </h2>
              <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                ثبت و روایت کنش‌های مردمی، پویش‌های محلی و رسانه‌ای در سراسر کشور.
              </p>
            </section>
          </div>
          {/* Both sidebar footers share the same wrapper and a 3.375rem control,
              so the two columns end at exactly the same height. */}
          <div className="border-t border-divider pt-4">
            <ThemeSwitcher />
          </div>
        </aside>
      </div>
    </UnreadProvider>
  );
}
