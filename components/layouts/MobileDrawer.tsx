"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  FileText,
  Clock,
  LogIn,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { DrawerViewer } from "./useDrawerViewer";
import { ThemeSwitcher } from "./ThemeSwitcher";

type Item = { href: string; label: string; icon: LucideIcon; active: (path: string, filter: string | null) => boolean; soon?: boolean };

const ITEMS: Item[] = [
  // Like the reference, «نمایه» always carries the filled square.
  { href: "/profile", label: "نمایه", icon: UserRound, active: () => true },
  { href: "/bookmarks", label: "نشان‌شده‌ها", icon: Bookmark, active: (p) => p === "/bookmarks" },
  { href: "/drafts", label: "پیش‌نویس‌ها", icon: FileText, active: (p) => p === "/drafts" },
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

const fa = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
/** «۳٫۸k» like the reference. */
const compact = { format: (value: number) => (value >= 1000 ? `${fa.format(Math.floor(value / 100) / 10)}k` : fa.format(value)) };

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
        className={`absolute inset-y-0 right-0 flex w-[310px] max-w-[86vw] touch-pan-y flex-col overflow-hidden rounded-l-[32px] bg-background text-foreground shadow-[-20px_0_80px_rgba(0,0,0,.4)] outline-none transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex min-h-0 flex-1 touch-pan-y flex-col overflow-y-auto overscroll-contain pb-2">
          <div className="relative h-[118px] shrink-0 overflow-hidden bg-[linear-gradient(135deg,#3b3b3b,#161616)]">
            {/* Without a cover of their own, people get the app's default one, as on the profile. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- remote cover of any size */}
            <img src={viewer?.coverUrl || "/images/header.jpg"} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.25),transparent_50%,var(--background))]" />
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="absolute left-3.5 top-3.5 z-[2] grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="relative z-[2] px-[22px] pb-4">
          {isAuthenticated && !viewer ? (
            <div aria-hidden="true" className="animate-pulse">
              <span className="block h-20 w-20 rounded-full border-4 border-background bg-skeleton" />
              <span className="mt-3 block h-5 w-36 rounded-md bg-skeleton" />
              <span className="mt-2 block h-3 w-24 rounded-md bg-skeleton-highlight" />
              <div className="mt-4 grid grid-cols-3 gap-2"><span className="h-[3.25rem] rounded-2xl bg-skeleton" /><span className="h-[3.25rem] rounded-2xl bg-skeleton" /><span className="h-[3.25rem] rounded-2xl bg-skeleton" /></div>
            </div>
          ) : isAuthenticated && viewer ? (
            <>
              <Link href="/profile" className="-mt-14 block h-[104px] w-[104px] rounded-full bg-background p-1 shadow-[0_12px_30px_-12px_rgba(0,0,0,.5)]">
                <span className="block h-full w-full overflow-hidden rounded-full bg-surface-muted">
                  {viewer.avatarUrl ? (
                    <OptimizedAvatar src={viewer.avatarUrl} alt="" width={96} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-3xl font-black text-foreground">{viewer.name.charAt(0)}</span>
                  )}
                </span>
              </Link>
              <p className="mt-3 flex items-center gap-1.5 whitespace-nowrap text-[21px] font-black tracking-[-.2px] text-foreground">
                {viewer.name}
                <AccountBadges verified={viewer.verified} kind={viewer.kind} size="md" />
              </p>
              {viewer.handle ? <p className="mt-px text-right text-[13px] text-muted-foreground latin-digits" dir="ltr">@{viewer.handle}</p> : null}
              <div className="mt-3.5 flex gap-2">
                {[
                  { value: viewer.followers, label: "دنبال‌کننده" },
                  { value: viewer.following, label: "دنبال‌شده" },
                  // Signatures don't exist yet.
                  { value: null, label: "امضا" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-1 flex-col items-center gap-px rounded-2xl bg-surface-muted px-1 py-[9px] text-[10.5px] text-muted-foreground">
                    {stat.value === null ? (
                      <strong className="text-[13px] font-extrabold leading-6 text-foreground">به‌زودی</strong>
                    ) : (
                      <strong className="text-base font-extrabold text-foreground">{compact.format(stat.value)}</strong>
                    )}
                    {stat.label}
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

          </div>
          <nav aria-label="منوی اصلی" className="flex flex-col gap-0.5 px-3 pb-2 pt-1">
            {ITEMS.filter(() => isAuthenticated).map(
              ({ href, label, icon: Icon, active, soon }) => {
                const isActive = active(pathname, filter);
                if (soon) {
                  return (
                    <div key={href} aria-disabled="true" className="flex cursor-default items-center gap-3 rounded-2xl px-1 py-1.5 text-sm font-black text-foreground">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-muted text-icon">
                        <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                      </span>
                      {label}
                      <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        <Clock aria-hidden="true" className="h-3 w-3" />
                        به‌زودی
                      </span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={href}
                    href={href as Route}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3.5 rounded-[18px] px-2.5 py-1.5 text-[15px] text-foreground transition hover:bg-surface-muted active:scale-[.98] ${isActive ? "font-extrabold" : "font-semibold"}`}
                  >
                    <span
                      className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[13px] transition-colors ${
                        isActive ? "bg-foreground text-background" : "bg-surface-muted text-foreground"
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

        <div className="shrink-0 space-y-2.5 border-t border-border px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3.5 text-muted-foreground">
          <ThemeSwitcher variant="drawer" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
