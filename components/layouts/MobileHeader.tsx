"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { AppLogo } from "@/components/shared/AppLogo";
import { ThemeMenu } from "./ThemeMenu";

export function MobileHeader() {
  const pathname = usePathname();
  const isConversationRoute = pathname.startsWith("/chat/");
  const isContentDetailRoute = pathname.startsWith("/content/");
  const isPostRoute = pathname.startsWith("/posts/");
  const isExploreRoute = pathname === "/explore";
  const isProfileRoute = pathname === "/profile" || pathname.startsWith("/profile/");
  const isInitiativeRoute = pathname.startsWith("/initiatives/");
  const isSpeakerInvitationRoute = pathname.startsWith("/speaker-invitations");

  if (pathname === "/chat" || isConversationRoute || isContentDetailRoute || isPostRoute || isExploreRoute || isProfileRoute || isInitiativeRoute || isSpeakerInvitationRoute) return null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface-glass px-4 py-3 backdrop-blur-md lg:hidden">
      <Link href="/home" className="flex min-w-0 items-center gap-2.5" aria-label="خانه میدان خیابان">
        <AppLogo className="h-8 w-8 rounded-full" priority />
        <span className="min-w-0">
          <span className="block truncate text-sm font-black leading-tight text-foreground">نقش من</span>
          <span className="block truncate text-[10px] text-muted-foreground">شبکه همبستگی و روایت میادین ایران</span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        {/* Explore lives here on mobile now that chat owns its bottom-nav slot. */}
        <Link
          href="/explore"
          aria-label="کاوش و جستجو"
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface-muted text-icon transition-colors hover:bg-hover hover:text-brand"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
        </Link>
        <ThemeMenu />
      </div>
    </header>
  );
}
