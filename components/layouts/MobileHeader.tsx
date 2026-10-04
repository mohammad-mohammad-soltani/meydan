"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserRound } from "lucide-react";
import { Suspense, useCallback, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { MobileDrawer } from "./MobileDrawer";
import { useDrawerViewer } from "./useDrawerViewer";
import { AppLogo } from "@/components/shared/AppLogo";

export function MobileHeader() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthGate();
  const viewer = useDrawerViewer(isAuthenticated);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const isConversationRoute = pathname.startsWith("/chat/");
  const isContentDetailRoute = pathname.startsWith("/content/");
  const isPostRoute = pathname.startsWith("/posts/");
  const isExploreRoute = pathname === "/explore";
  const isProfileRoute = pathname === "/profile" || pathname.startsWith("/profile/");
  const isInitiativeRoute = pathname.startsWith("/initiatives/");
  const isSpeakerInvitationRoute = pathname.startsWith("/speaker-invitations");

  // The reference shows the header on the timeline only; the content hub and the live map open straight on their own bars.
  if (pathname === "/chat" || pathname === "/content" || pathname === "/map" || isConversationRoute || isContentDetailRoute || isPostRoute || isExploreRoute || isProfileRoute || isInitiativeRoute || isSpeakerInvitationRoute) return null;

  return (
    <header className={`${pathname === "/home" ? "relative" : "sticky top-0"} z-40 flex items-center justify-between border-b border-divider bg-surface-glass px-4 py-2.5 backdrop-blur-md lg:hidden`}>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="باز کردن منو"
        aria-expanded={drawerOpen}
        className="relative grid h-9 w-9 place-items-center rounded-full p-0.5 transition active:scale-95"
      >
        {viewer?.avatarUrl ? (
          <OptimizedAvatar src={viewer.avatarUrl} alt="" width={32} className="h-8 w-8 rounded-full border border-border object-cover" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface-muted text-icon">
            {viewer ? <span className="text-xs font-black text-foreground">{viewer.name.charAt(0)}</span> : isAuthenticated ? <span aria-hidden="true" className="h-8 w-8 animate-pulse rounded-full bg-skeleton" /> : <UserRound aria-hidden="true" className="h-4 w-4" />}
          </span>
        )}
      </button>
      <Link href="/home" aria-label="خانه نقش من" className="absolute left-1/2 -translate-x-1/2">
        <AppLogo className="h-7 w-7 rounded-lg" priority />
      </Link>
      {/* Explore lives here on mobile now that chat owns its bottom-nav slot. */}
      <Link
        href="/explore"
        aria-label="کاوش و جستجو"
        className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface-elevated text-icon transition-colors hover:bg-hover"
      >
        <Search aria-hidden="true" className="h-4 w-4" />
      </Link>
      <Suspense fallback={null}>
        <MobileDrawer open={drawerOpen} onClose={closeDrawer} viewer={viewer} isAuthenticated={isAuthenticated} />
      </Suspense>
    </header>
  );
}
