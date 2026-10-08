"use client";

import { isPublicProfilePath } from "@/lib/profile-route";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import {
  FolderKanban,
  SquarePlay,
  Sparkles,
  Home,
  LogIn,
  MapPin,
  MessageCircle,
  Users,
  Search,
  UserCheck,
} from "lucide-react";
import { MiniPlayer } from "@/features/audio/MiniPlayer";
import { AdminNavLink } from "@/components/layouts/AdminNavLink";
import { AppLogo } from "@/components/shared/AppLogo";
import { AvatarTone } from "@/components/shared/AvatarTone";
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
import { SidebarBanners } from "./SidebarBanners";
import { SidebarComposeButton } from "./SidebarComposeButton";
import { SidebarUserCard } from "./SidebarUserCard";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";

type AppShellProps = {
  children: ReactNode;
  isAuthenticated?: boolean;
  isNativeClient?: boolean;
};

// Sizes follow the reference: 16.5px / weight 500 labels, 22px icons with a thin stroke.
const navIcon = "h-[22px] w-[22px] shrink-0 stroke-[1.8]";
const desktopLinkClass =
  "relative z-10 flex items-center gap-3 rounded-[18px] px-3.5 py-[13px] text-[16.5px] font-medium transition-colors";
// One text color per state: with both in the class list the stylesheet order,
// not the intent, decided which one won.
const idleDesktopLinkClass = "text-foreground hover:bg-surface-muted";
const activeDesktopLinkClass = "text-foreground";

const NAV_SECTIONS = ["/home", "/content", "/map", "/chat", "/profile"];
/** Position of the bottom-nav section a path belongs to, or -1 for pages outside the tab bar. */
function navSectionIndex(path: string) {
  return NAV_SECTIONS.findIndex((section) => path === section || (section === "/chat" && path.startsWith("/chat/")));
}

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
  const shellRef = useRef<HTMLDivElement>(null);
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
  // Pages keep the standard centre column (like a timeline) with the trends column beside it. Only the
  // reels viewer needs the wide column, for its comments panel; chat and admin have their own layouts.
  const isWideRoute = pathname === "/videos";
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

  // Switching between the bottom-nav sections slides the incoming page in from the side the tab sits on
  // (RTL: later tabs are further left). Read by `.route-transition-stage` in globals.css.
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    const from = navSectionIndex(previousPath.current);
    const to = navSectionIndex(pathname);
    previousPath.current = pathname;
    const root = document.documentElement;
    if (from < 0 || to < 0 || from === to) return;
    root.dataset.navDir = to > from ? "L" : "R";
    const timer = window.setTimeout(() => delete root.dataset.navDir, 500);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const main = mainScrollRef.current;
    const shell = shellRef.current;
    if (!main || !shell) return;
    let previous = main.scrollTop;
    const onScroll = () => {
      const top = main.scrollTop;
      if (top <= 2 || top < previous - 3) shell.dataset.scrollDown = "false";
      else if (top > previous + 1 && top > 8) shell.dataset.scrollDown = "true";
      previous = top;
    };
    shell.dataset.scrollDown = "false";
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Portalled profile sheets use the same viewport bounds as the content column.
  useEffect(() => {
    const column = document.getElementById("mainAppShell");
    if (!column) return;
    const measure = () => {
      const bounds = column.getBoundingClientRect();
      document.documentElement.style.setProperty("--col-l", `${bounds.left}px`);
      document.documentElement.style.setProperty("--col-w", `${bounds.width}px`);
      const shellWidth = shellRef.current?.getBoundingClientRect().width ?? 1225;
      document.documentElement.style.setProperty("--ns", `${Math.max(0, (shellWidth - 1225) / 2)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [isChatRoute, isWideRoute]);

  const showBottomNav = !isPostPage && !isComposePage && !isAdminRoute && !pathname.startsWith("/chat/") && (!isNativeClient || isAuthenticated);

  return (
    <UnreadProvider isAuthenticated={isAuthenticated}>
      <div
        ref={shellRef}
        className={`${styles.shell} ${isWideRoute ? styles.wide : ""} ${isChatRoute ? styles.chat : ""} mx-auto flex h-[100dvh] w-full justify-center overflow-hidden bg-background text-foreground ${isAdminRoute ? "admin-route" : ""} ${isWorksRoute ? "works-route" : ""} ${isWideRoute ? "wide-route" : ""}`}
      >
        <AvatarTone />
        <PostLoginReturn />
        <PushEnrollment isAuthenticated={isAuthenticated} />
        <aside className={`${styles.navigation} hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-l border-border bg-background p-4 lg:flex`}>
          <div className={`${styles.navHeader} space-y-6`}>
            <Link href="/home" className="flex items-center gap-3 px-2">
              <AppLogo appearance="ring" priority className="h-12 w-12 rounded-[15px]" />
              <span data-nav-label>
                <span className="block text-lg font-black leading-[27px] text-foreground">
                  نقش من
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  شبکه سراسری میادین ایران
                </span>
              </span>
            </Link>
            <div className="space-y-4">
              <nav
                ref={desktopNavRef}
                aria-label="ناوبری دسکتاپ"
                className={`${styles.nav} relative space-y-1`}
              >
                <DesktopNavIndicator containerRef={desktopNavRef} />
                <Link href="/home" {...desktopLink(pathname, "/home")}>
                  <Home className={navIcon} />
                  <span data-nav-label>خانه و روایت‌ها</span>
                </Link>
                <Link href="/content" {...desktopLink(pathname, "/content")}>
                  <FolderKanban className={navIcon} />
                  <span data-nav-label>بسته محتوا</span>
                </Link>
                <Link href="/videos" {...desktopLink(pathname, "/videos")}>
                  <SquarePlay className={navIcon} />
                  <span data-nav-label>چندرسانه‌ای</span>
                </Link>
                <Link href="/speakers" {...desktopLink(pathname, "/speakers")}>
                  <Users className={navIcon} />
                  <span data-nav-label>اعزام سخنران</span>
                </Link>
                <Link href="/map" {...desktopLink(pathname, "/map")}>
                  <MapPin className={navIcon} />
                  <span data-nav-label>نقشه زنده</span>
                </Link>
                <Link href="/chat" {...desktopLink(pathname, "/chat")}>
                  <MessageCircle className={navIcon} />
                  <span data-nav-label>گفتگو</span>
                  <NavBadge className="ms-auto" />
                </Link>
                <Link href="/explore" {...desktopLink(pathname, "/explore")}>
                  <Search className={navIcon} />
                  <span data-nav-label>کاوش و جستجو</span>
                </Link>
                {isAuthenticated ? (
                  <AdminNavLink
                    isAuthenticated={isAuthenticated}
                    {...desktopLink(pathname, "/admin")}
                  />
                ) : null}
                {isAuthenticated ? (
                  <Link href="/profile" {...desktopLink(pathname, "/profile")}>
                    <UserCheck className={navIcon} />
                    <span data-nav-label>نمایه</span>
                  </Link>
                ) : (
                  <Link href="/auth" {...desktopLink(pathname, "/auth")}>
                    <LogIn className={navIcon} />
                    <span data-nav-label>ورود</span>
                  </Link>
                )}
              </nav>
              {/* X-style primary action: signed-in desktop viewers compose here. */}
              {isAuthenticated ? <SidebarComposeButton /> : null}
            </div>
          </div>
          <div className="border-t border-[var(--sidebar-divider)] pt-3">
            <SidebarUserCard isAuthenticated={isAuthenticated} />
          </div>
        </aside>
        <div
          id="mainAppShell"
          className={`${styles.column} relative flex h-[100dvh] min-h-0 w-full flex-col border-x border-border bg-background transition-colors duration-150 ${isAdminRoute
  ? "max-w-none"
  : "max-w-[600px] lg:w-[600px] lg:flex-none pb-[var(--comment-composer-height)]"
}`}
        >
          {!isWorksRoute && !isAdminRoute && !isComposePage && !isPublicProfilePage && pathname !== "/speakers" ? (
            pathname === "/home" ? null : <MobileHeader />
          ) : null}
          <main
            ref={mainScrollRef}
            className={`relative z-0 flex min-h-0 flex-1 flex-col overflow-x-hidden no-scrollbar ${showBottomNav ? "pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0" : ""} ${isAdminRoute || isWorksRoute || isChatRoute ? "overflow-hidden" : "overflow-y-auto"}`}
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
          {showBottomNav ? (
            <BottomNavigation isAuthenticated={isAuthenticated} />
          ) : null}
        </div>
        <aside className={`${styles.trends} hidden h-screen w-72 shrink-0 flex-col justify-between gap-4 overflow-y-auto border-r border-border bg-background p-4 lg:flex`}>
          <div className="space-y-4">
            <SidebarBanners />
            <SilentBoundary label="trends-panel">
              <HotTrendsPanel />
            </SilentBoundary>
            <section className="rounded-2xl border border-[var(--rail-note-border)] bg-[var(--rail-note)] p-3.5 text-xs leading-relaxed text-[var(--rail-meta)]">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-[var(--rail-note-title)]">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-icon" />
                شبکه همبستگی ایران
              </h2>
              <p className="mt-1 text-[11px]">ثبت و روایت کنش‌های مردمی، پویش‌های محلی و رسانه‌ای در سراسر کشور.</p>
            </section>
          </div>
          {/* Both sidebar footers share the same wrapper and a 3.375rem control,
              so the two columns end at exactly the same height. */}
          <div className="border-t border-[var(--sidebar-divider)] pt-4">
            <ThemeSwitcher />
          </div>
        </aside>
      </div>
    </UnreadProvider>
  );
}
