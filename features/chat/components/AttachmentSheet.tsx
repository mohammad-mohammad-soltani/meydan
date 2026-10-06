"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMe } from "@/lib/me-client";
import {
  FileText,
  Image as ImageIcon,
  MapPin,
  Mic,
  Video,
  X,
} from "lucide-react";

type AttachmentKind = "image" | "video" | "audio" | "file";

type FileOption = {
  id: AttachmentKind;
  label: string;
  hint: string;
  /** Passed to the hidden input; omitted for "any file". */
  accept?: string;
  icon: typeof ImageIcon;
  tone: string;
};

const fileOptions: FileOption[] = [
  {
    id: "image",
    label: "عکس",
    hint: "تصویر از گالری یا دوربین",
    accept: "image/*",
    icon: ImageIcon,
    tone: "bg-info-surface text-info",
  },
  {
    id: "video",
    label: "ویدیو",
    hint: "کلیپ کوتاه میدانی",
    accept: "video/*",
    icon: Video,
    tone: "bg-brand-muted text-brand",
  },
  {
    id: "audio",
    label: "صوت",
    hint: "فایل صوتی یا پیام صوتی",
    accept: "audio/*",
    icon: Mic,
    tone: "bg-accent-surface text-accent",
  },
  {
    id: "file",
    label: "فایل",
    hint: "سند، PDF، جدول و …",
    icon: FileText,
    tone: "bg-surface-muted text-icon",
  },
];

/**
 * Telegram-style attachment menu: one sheet with a purpose per file type plus
 * the square-location card. Files go through the shared upload pipeline, the
 * location is resolved and sent by the conversation hook.
 */
export function AttachmentSheet({
  onClose: onClosed,
  onSelectFile,
  onSendLocation,
}: {
  onClose: () => void;
  onSelectFile: (file: File) => void;
  onSendLocation: () => void;
}) {
  const [closing, setClosing] = useState(false);
  // Only a square account has a location to send.
  const { me } = useMe<{ account_type?: string }>(true);
  const isSquare = me?.account_type === "square";
  /** Plays the slide-down, then tells the parent. */
  const onClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClosed, 220);
  }, [onClosed]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputs = useRef<Partial<Record<AttachmentKind, HTMLInputElement | null>>>({});

  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ].filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const rowClass =
    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-right outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring";

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className={`attach-backdrop ${closing ? "is-closing" : ""} fixed inset-0 z-[120] flex items-end justify-center bg-overlay/70 backdrop-blur-sm sm:items-center`}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="افزودن پیوست"
        onClick={(event) => event.stopPropagation()}
        className="attach-sheet w-full max-w-md rounded-t-panel border border-border bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-popover-foreground shadow-dialog sm:rounded-panel sm:pb-4"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black text-foreground">افزودن پیوست</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="بستن منوی پیوست"
            className="grid h-9 w-9 place-items-center rounded-full text-icon-muted outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1">
          {fileOptions.map(({ id, label, hint, icon: Icon, tone }) => (
            <button
              key={id}
              type="button"
              onClick={() => inputs.current[id]?.click()}
              className={rowClass}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tone}`}>
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[13px] font-black text-foreground">{label}</strong>
                <small className="mt-0.5 block truncate text-[11px] text-muted-foreground">{hint}</small>
              </span>
            </button>
          ))}

          {isSquare ? <button
            type="button"
            onClick={() => {
              onSendLocation();
              onClose();
            }}
            className={`${rowClass} border border-dashed border-border`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
              <MapPin aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[13px] font-black text-foreground">موقعیت مکانی میدان</strong>
              <small className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                نشانی و موقعیت میدان برای مخاطب فرستاده می‌شود
              </small>
            </span>
          </button> : null}
        </div>

        {fileOptions.map(({ id, accept }) => (
          <input
            key={id}
            ref={(element) => {
              inputs.current[id] = element;
            }}
            type="file"
            accept={accept}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              onSelectFile(file);
              onClose();
            }}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
