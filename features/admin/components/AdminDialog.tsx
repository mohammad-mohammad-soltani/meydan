"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import {
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./styles";

/**
 * The repo's confirmation-dialog pattern (`InviteSpeakerForm`,
 * `ProfileActionsMenu`): a portalled overlay that closes on Escape and on a
 * backdrop click, with `role="dialog"` and `aria-modal`.
 *
 * Focus is moved into the dialog on open and restored to the trigger on close,
 * because every destructive admin action travels through here and keyboard
 * users otherwise lose their place in a long table.
 */
export function AdminDialog({
  title,
  description,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  tone = "default",
  busy = false,
  error,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` renders the confirm button as destructive. */
  tone?: "default" | "danger";
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
  /** Extra body content, e.g. the `admin_note` textarea. */
  children?: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  const restoreFocusTo = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  useEffect(() => {
    onCloseRef.current = onClose;
    busyRef.current = busy;
  }, [onClose, busy]);

  useEffect(() => {
    restoreFocusTo.current = document.activeElement;
    panel.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const target = restoreFocusTo.current;
      if (target instanceof HTMLElement && document.contains(target)) target.focus();
    };
  }, []);

  return createPortal(
    <div
      role="presentation"
      onClick={() => { if (!busy) onClose(); }}
      className="admin-dialog-root fixed inset-0 z-[120] flex items-end justify-center bg-overlay p-4 sm:items-center"
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-panel border border-border bg-popover text-popover-foreground shadow-dialog outline-none ${children ? "max-w-2xl" : "max-w-md"}`}
      >
        <header className="flex items-start gap-3 border-b border-divider bg-surface-muted/60 px-5 py-4">
          {tone === "danger" ? (
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger-surface text-danger"
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-foreground">{title}</h2>
            {description ? (
              <p className="mt-1 text-[11px] leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="بستن"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 no-scrollbar">{children}</div>
        ) : null}

        {error ? (
          <p role="alert" className="mx-5 mt-3 rounded-control bg-danger-surface px-3 py-2 text-xs font-bold text-danger-foreground">
            {error}
          </p>
        ) : null}

        <footer className="mt-auto flex items-center justify-end gap-2 border-t border-divider bg-surface-muted/60 px-5 py-3.5">
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={tone === "danger" ? dangerButtonClass : primaryButtonClass}
          >
            {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            {busy ? "در حال انجام…" : confirmLabel}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
