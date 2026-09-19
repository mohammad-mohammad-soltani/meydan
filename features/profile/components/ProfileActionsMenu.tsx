"use client";

import { Link2, LoaderCircle, LogOut, MoreHorizontal, Share2 } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { closeRealtimeSession } from "@/lib/realtime/user-channel";
import type { ProfileDetails } from "../types";

/**
 * Canonical public URL for a profile. `accountType` uses the internal
 * "resume" label for personal accounts, but the public route segment is
 * "user", so the two cannot be used interchangeably.
 */
export function profilePath(profile: Pick<ProfileDetails, "accountType" | "actorId">): string {
  const segment = profile.accountType === "square" ? "square" : "user";
  return `/${profile.actorId}`;
}

const itemClass =
  "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-right text-xs font-black transition-colors focus-visible:outline-none";
const itemToneClass =
  "text-foreground-secondary hover:bg-hover hover:text-foreground focus-visible:bg-hover focus-visible:text-foreground";
const dangerItemToneClass =
  "text-danger hover:bg-danger-surface focus-visible:bg-danger-surface";

export function ProfileActionsMenu({
  profile,
  canEdit = false,
  onNotice,
}: {
  profile: ProfileDetails;
  canEdit?: boolean;
  onNotice: (message: string) => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const items = [
    { id: "share", label: "اشتراک‌گذاری نمایه", icon: Share2, danger: false, run: () => void share() },
    { id: "copy", label: "کپی لینک نمایه", icon: Link2, danger: false, run: () => void copyLink() },
    ...(canEdit
      ? [{ id: "logout", label: "خروج از حساب", icon: LogOut, danger: true, run: openConfirm }]
      : []),
  ];
  const itemCount = items.length;

  function canonicalUrl(): string {
    return new URL(profilePath(profile), window.location.origin).toString();
  }

  async function copyLink() {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(canonicalUrl());
      onNotice("لینک نمایه کپی شد");
    } catch {
      onNotice("کپی لینک انجام نشد");
    }
  }

  async function share() {
    const url = canonicalUrl();
    if (typeof navigator.share === "function") {
      try {
        // Cancelling the native sheet rejects; that is not an error.
        await navigator.share({ title: profile.identity.name, text: profile.identity.name, url });
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    await copyLink();
  }

  function openConfirm() {
    setOpen(false);
    setLogoutError("");
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (loggingOut) return;
    setConfirmOpen(false);
    trigger.current?.focus();
  }

  async function confirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("logout failed");

      // Stop protected requests from still reading the previous session, then
      // hard-navigate: a client-side transition would leave the pre-logout RSC
      // payload cached, so Back could restore the logged-in profile.
      document.documentElement.dataset.meydanAuthenticated = "false";
      closeRealtimeSession();
      // A client-side transition would keep the pre-logout RSC payload cached,
      // so Back could restore the signed-in profile. A full document request
      // re-runs the server auth check and sends the user to the login screen.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- logout must discard the router cache
      window.location.assign("/auth");
    } catch {
      setLogoutError("خروج از حساب انجام نشد. دوباره تلاش کنید.");
      setLoggingOut(false);
    }
  }

  // Close on outside pointer press and on Escape while the menu is open.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!wrapper.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Only moves DOM focus (an external system); no state is written here, so
  // this does not trigger an extra render pass.
  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!confirmOpen) return;
    cancelRef.current?.focus();
  }, [confirmOpen]);

  const focusItem = (index: number) => {
    const next = (index + itemCount) % itemCount;
    itemRefs.current[next]?.focus();
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.findIndex((item) => item === document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(current + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(itemCount - 1);
    } else if (event.key === "Tab") {
      // A menu is not modal: let focus leave naturally.
      setOpen(false);
    }
  };

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeConfirm();
      return;
    }
    if (event.key !== "Tab") return;

    // Keep focus inside the two-button dialog.
    event.preventDefault();
    const next = document.activeElement === cancelRef.current ? confirmRef.current : cancelRef.current;
    next?.focus();
  };

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-label="گزینه‌های بیشتر"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-actions-menu"
        onClick={() => setOpen((current) => !current)}
        className="grid h-10 w-10 place-items-center rounded-full border border-border text-icon outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {open ? (
        <div
          id="profile-actions-menu"
          role="menu"
          aria-label="گزینه‌های نمایه"
          onKeyDown={onMenuKeyDown}
          className="ui-enter absolute left-0 top-[calc(100%+.5rem)] z-[80] w-44 overflow-hidden rounded-card border border-border bg-popover p-1.5 text-popover-foreground shadow-popover"
        >
          {items.map(({ id, label, icon: Icon, danger, run }, index) => (
            <button
              key={id}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                run();
              }}
              className={`${itemClass} ${danger ? dangerItemToneClass : itemToneClass} ${danger ? "mt-1.5 border-t border-divider" : ""}`}
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="خروج از حساب"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
        >
          <div
            onKeyDown={onDialogKeyDown}
            className="w-full max-w-sm rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog"
          >
            <h2 className="text-sm font-black text-foreground">خروج از حساب</h2>
            <p className="mt-2 text-xs leading-6 text-foreground-secondary">
              آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟
            </p>

            {logoutError ? (
              <p role="alert" className="mt-3 text-xs font-bold leading-6 text-danger">
                {logoutError}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={closeConfirm}
                disabled={loggingOut}
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-4 text-xs font-black text-foreground-secondary outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                انصراف
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => void confirmLogout()}
                disabled={loggingOut}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-danger px-4 text-xs font-black text-on-solid outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70"
              >
                {loggingOut ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
                {loggingOut ? "در حال خروج…" : "خروج"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
