"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  FileText,
  Home,
  LogIn,
  Newspaper,
  Plus,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { DrawerViewer } from "./useDrawerViewer";
import { ThemeSwitcher } from "./ThemeSwitcher";

type Item = { href: string; label: string; icon: LucideIcon; active: (path: string, filter: string | null) => boolean };

const ITEMS: Item[] = [
  { href: "/home", label: "خانه", icon: Home, active: (p, f) => p === "/home" && !f },
  { href: "/profile", label: "نمایه", icon: UserRound, active: (p) => p === "/profile" },
  { href: "/home?filter=narratives", label: "روایت‌های مردمی", icon: FileText, active: (p, f) => p === "/home" && f === "narratives" },
  { href: "/home?filter=initiatives", label: "کار و اقدام میدانی", icon: Sparkles, active: (p, f) => p === "/home" && f === "initiatives" },
  { href: "/home?filter=reflected", label: "پویش‌های رسانه‌ای", icon: Newspaper, active: (p, f) => p === "/home" && f === "reflected" },
  { href: "/bookmarks", label: "نشان‌شده‌ها", icon: Bookmark, active: (p) => p === "/bookmarks" },
  { href: "/compose", label: "ثبت روایت یا پویش جدید", icon: Plus, active: () => false },
];

const subscribeNothing = () => () => {};

/** Drag distance (px) before the gesture picks an axis. */
const AXIS_LOCK_PX = 8;
/** Share of the panel width a slow release has to travel to close. */
const CLOSE_RATIO = 0.32;
/** px/ms past which a short flick closes anyway. */
const FLICK_VELOCITY = 0.45;
/** Pull felt when dragging against the open position. */
const RUBBER = 0.12;
const SETTLE_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  axis: "unknown" | "x" | "y";
  width: number;
};

const compact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });

/**
 * The mobile side menu opened from the header avatar: identity, follower
 * counts, the main sections and the theme switch. Its data comes from the
 * shared `/me` read, so opening it costs no request.
 */
export function MobileDrawer({
  open,
  onClose,
  viewer,
  isAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  viewer: DrawerViewer | null;
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();
  const filter = useSearchParams().get("filter");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClickRef = useRef(false);
  const settleRef = useRef<number | null>(null);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);

  // Close on navigation, Escape, and lock the page behind it while open.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only route changes should close it
  }, [pathname, filter]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /** Hands the panel and backdrop back to their classes once a drag has settled. */
  const clearInline = useCallback(() => {
    for (const node of [panelRef.current, backdropRef.current]) {
      if (!node) continue;
      node.style.transition = "";
      node.style.transform = "";
      node.style.opacity = "";
      node.style.willChange = "";
    }
  }, []);

  /** Every frame of the drag is a direct style write; React only hears about the final close. */
  const paint = (offset: number, width: number) => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (panel) panel.style.transform = `translate3d(${offset}px, 0, 0)`;
    if (backdrop) backdrop.style.opacity = String(Math.max(0, 1 - offset / width));
  };

  const settle = (to: number, from: number, velocity: number, closing: boolean) => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel) return;
    const distance = Math.abs(to - from);
    // Keep the speed the finger had; never slower than a quick ease, never longer than the class animation.
    const ms = Math.round(Math.min(320, Math.max(140, velocity > 0.2 ? distance / velocity : distance * 1.1)));
    panel.style.transition = `transform ${ms}ms ${SETTLE_EASING}`;
    if (backdrop) backdrop.style.transition = `opacity ${ms}ms ${SETTLE_EASING}`;
    panel.style.transform = `translate3d(${to}px, 0, 0)`;
    if (backdrop) backdrop.style.opacity = closing ? "0" : "1";
    if (settleRef.current) window.clearTimeout(settleRef.current);
    settleRef.current = window.setTimeout(() => {
      settleRef.current = null;
      if (closing) {
        onClose();
        // The closed class lands at the same spot (fully off-screen), so releasing the inline styles is invisible.
        window.requestAnimationFrame(() => window.requestAnimationFrame(clearInline));
      } else {
        clearInline();
      }
    }, ms + 20);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!open || dragRef.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (settleRef.current) {
      window.clearTimeout(settleRef.current);
      settleRef.current = null;
    }
    const width = panelRef.current?.getBoundingClientRect().width ?? 320;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastTime: event.timeStamp, velocity: 0, axis: "unknown", width };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (drag.axis === "unknown") {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      // Vertical belongs to the menu's own scrolling.
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.axis = "y";
        return;
      }
      drag.axis = "x";
      rootRef.current?.setPointerCapture(event.pointerId);
      const panel = panelRef.current;
      const backdrop = backdropRef.current;
      if (panel) {
        panel.style.transition = "none";
        panel.style.willChange = "transform";
      }
      if (backdrop) {
        backdrop.style.transition = "none";
        backdrop.style.willChange = "opacity";
      }
    }
    if (drag.axis !== "x") return;
    const dt = event.timeStamp - drag.lastTime;
    if (dt >= 8) {
      // Smoothed so one noisy sample cannot decide a flick.
      drag.velocity = drag.velocity * 0.6 + ((event.clientX - drag.lastX) / dt) * 0.4;
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
    }
    paint(dx > 0 ? dx : dx * RUBBER, drag.width);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (drag.axis !== "x") return;
    // The release of a drag must not also click the link or button under the finger.
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    rootRef.current?.releasePointerCapture?.(event.pointerId);
    const dx = Math.max(0, event.clientX - drag.startX);
    const close = !cancelled && (dx > drag.width * CLOSE_RATIO || (drag.velocity > FLICK_VELOCITY && dx > 12));
    settle(close ? drag.width : 0, dx, Math.abs(drag.velocity), close);
  };

  // Portals only after hydration: the server has no document.body to render into.
  if (!hydrated) return null;

  return createPortal(
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[70] lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
      onPointerDown={onPointerDown}
      // A dragged link would start the browser's native drag-and-drop and cancel the pointer stream.
      onDragStart={(event) => event.preventDefault()}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endDrag(event, false)}
      onPointerCancel={(event) => endDrag(event, true)}
      onClickCapture={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <button
        ref={backdropRef}
        type="button"
        tabIndex={-1}
        aria-label="بستن منو"
        onClick={onClose}
        className={`absolute inset-0 touch-none bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="منوی اصلی"
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-[88%] max-w-sm touch-pan-y flex-col overflow-hidden rounded-l-3xl border-l border-border bg-background outline-none transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="relative h-36 shrink-0 overflow-hidden bg-gradient-to-b from-surface-elevated to-background">
          {viewer?.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote cover of any size
            <img src={viewer.coverUrl} alt="" className="h-full w-full object-cover opacity-70" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-glass text-foreground backdrop-blur"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="-mt-14 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4">
          {isAuthenticated && !viewer ? (
            <div aria-hidden="true" className="animate-pulse">
              <span className="block h-20 w-20 rounded-full border-4 border-background bg-skeleton" />
              <span className="mt-3 block h-5 w-36 rounded-md bg-skeleton" />
              <span className="mt-2 block h-3 w-24 rounded-md bg-skeleton-highlight" />
              <div className="mt-4 grid grid-cols-2 gap-2"><span className="h-[3.25rem] rounded-2xl bg-skeleton" /><span className="h-[3.25rem] rounded-2xl bg-skeleton" /></div>
            </div>
          ) : isAuthenticated && viewer ? (
            <>
              <span className="relative block h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-surface-muted">
                {viewer.avatarUrl ? (
                  <OptimizedAvatar src={viewer.avatarUrl} alt="" width={80} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-2xl font-black text-foreground">{viewer.name.charAt(0)}</span>
                )}
              </span>
              <p className="mt-3 flex items-center gap-1.5 text-lg font-black text-foreground">
                {viewer.name}
                <AccountBadges verified={viewer.verified} kind={viewer.kind} size="md" />
              </p>
              {viewer.handle ? <p className="mt-0.5 text-xs text-muted-foreground latin-digits" dir="ltr">@{viewer.handle}</p> : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { value: viewer.followers, label: "دنبال‌کننده" },
                  { value: viewer.following, label: "دنبال‌شده" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-surface-muted px-3 py-2.5 text-center">
                    <strong className="block text-base font-black text-foreground">{compact.format(stat.value)}</strong>
                    <span className="block text-[10px] text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="pt-16">
              <Link
                href="/auth"
                className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emphasis text-sm font-black text-emphasis-foreground"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                ورود یا ثبت‌نام
              </Link>
            </div>
          )}

          <nav aria-label="منوی اصلی" className="mt-5 space-y-1">
            {ITEMS.filter((item) => isAuthenticated || (item.href !== "/profile" && item.href !== "/bookmarks" && item.href !== "/compose")).map(
              ({ href, label, icon: Icon, active }) => {
                const isActive = active(pathname, filter);
                return (
                  <Link
                    key={href}
                    href={href as Route}
                    aria-current={isActive ? "page" : undefined}
                    className="flex items-center gap-3 rounded-2xl px-1 py-1.5 text-sm font-black text-foreground transition-colors hover:bg-hover"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                        isActive ? "border-transparent bg-emphasis text-emphasis-foreground" : "border-border bg-surface-muted text-icon"
                      }`}
                    >
                      <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                    </span>
                    {label}
                  </Link>
                );
              },
            )}
          </nav>
        </div>

        <div className="shrink-0 border-t border-divider px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 text-[11px] font-bold text-muted-foreground">پوسته و رنگ برنامه</p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>,
    document.body,
  );
}
