"use client";

import { Pencil, Repeat2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAuthGate } from "@/components/providers/AuthGateProvider";

type RepostMenuProps = {
  /** The viewer already reposted this post, so the first option undoes it. */
  reposted: boolean;
  onRepost: () => void;
  onQuote: () => void;
  /** Trigger contents: the icon and the count. */
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

/** Phones get X's bottom sheet; wider screens get a dropdown anchored to the button. */
const DROPDOWN_QUERY = "(min-width: 40rem)";
const MENU_WIDTH = 208;
const MENU_HEIGHT = 112;
const EDGE = 8;

type Placement = { mode: "sheet" } | { mode: "dropdown"; style: CSSProperties };

function placementFor(trigger: HTMLElement): Placement {
  if (!window.matchMedia(DROPDOWN_QUERY).matches) return { mode: "sheet" };
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(
    Math.max(EDGE, rect.left + rect.width / 2 - MENU_WIDTH / 2),
    window.innerWidth - MENU_WIDTH - EDGE,
  );
  const fitsBelow = rect.bottom + 4 + MENU_HEIGHT <= window.innerHeight - EDGE;
  return {
    mode: "dropdown",
    style: fitsBelow
      ? { left, top: rect.bottom + 4, width: MENU_WIDTH }
      : { left, bottom: window.innerHeight - rect.top + 4, width: MENU_WIDTH },
  };
}

/**
 * The repost/quote toggle button, styled after X: a bottom sheet with a grab
 * handle on phones and a compact dropdown on larger screens. The menu is
 * portaled to `body` because feed cards sit inside transformed swipe
 * containers, which would otherwise make `fixed` relative to the card.
 */
export function RepostMenu({ reposted, onRepost, onQuote, children, className = "", disabled = false }: RepostMenuProps) {
  const { requireAuth } = useAuthGate();
  const [placement, setPlacement] = useState<Placement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const open = placement !== null;

  const close = useCallback((restoreFocus = true) => {
    setPlacement(null);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    firstOptionRef.current?.focus({ preventScroll: true });
    // Captured so Escape closes only this menu, not a viewer or dialog behind it.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      close();
    };
    // An anchored dropdown would drift away from its button.
    const onMove = () => close(false);
    window.addEventListener("keydown", onKeyDown, true);
    if (placement.mode === "dropdown") {
      window.addEventListener("scroll", onMove, true);
      window.addEventListener("resize", onMove);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [close, open, placement]);

  const choose = (action: () => void) => {
    setPlacement(null);
    action();
  };

  const isSheet = placement?.mode === "sheet";
  const optionClass = isSheet
    ? "flex min-h-14 w-full items-center gap-1 px-5 text-start text-[13px] font-bold text-foreground transition-colors hover:bg-hover active:bg-hover"
    : "flex min-h-11 w-full items-center gap-3 px-4 text-start text-[15px] font-bold text-foreground transition-colors hover:bg-hover";
  const iconClass = isSheet ? "size-5 shrink-0" : "h-5 w-5 shrink-0";

  const options = (
    <>
      <button ref={firstOptionRef} type="button" role="menuitem" onClick={() => choose(onRepost)} className={optionClass}>
        <Repeat2 aria-hidden="true" className={`${iconClass} ${reposted ? "text-success" : ""}`} />
        {reposted ? "لغو بازنشر" : "بازنشر"}
      </button>
      <button type="button" role="menuitem" onClick={() => choose(onQuote)} className={optionClass}>
        <Pencil aria-hidden="true" className={iconClass} />
        نقل‌قول
      </button>
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        data-action="repost"
        data-reposted={reposted}
        aria-pressed={reposted}
        aria-label="بازنشر یا نقل‌قول روایت"
        onClick={(event) => {
          event.stopPropagation();
          if (!requireAuth() || !triggerRef.current) return;
          setPlacement(placementFor(triggerRef.current));
        }}
        className={className}
      >
        {children}
      </button>

      {placement
        ? createPortal(
            <div
              className={`fixed inset-0 z-[90] ${isSheet ? "repost-sheet-backdrop flex items-end bg-overlay" : ""}`}
              // Portaled events still bubble through the React tree to drag-aware parents.
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                if (event.target === event.currentTarget) close();
              }}
            >
              {placement.mode === "sheet" ? (
                <div
                  role="menu"
                  aria-label="بازنشر یا نقل‌قول"
                  dir="rtl"
                  className="repost-sheet w-full rounded-t-[1.25rem] border-t border-border bg-popover pb-[max(1rem,env(safe-area-inset-bottom))] text-popover-foreground shadow-dialog"
                >
                  <span aria-hidden="true" className="mx-auto mb-2 mt-2.5 block h-1 w-10 rounded-full bg-foreground-subtle/50" />
                  {options}
                </div>
              ) : (
                <div
                  role="menu"
                  aria-label="بازنشر یا نقل‌قول"
                  dir="rtl"
                  style={placement.style}
                  className="fixed overflow-hidden rounded-card border border-border bg-popover py-1 text-popover-foreground shadow-dialog"
                >
                  {options}
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
