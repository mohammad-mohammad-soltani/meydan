"use client";

import styles from "../reference.module.css";

import { Ellipsis, FileImage, Link2, Pin, PinOff, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** The «…» menu in a post header: photo-quote, share, copy link, and delete when the viewer may. */
export function PostMoreMenu({ postId, onDelete, pinned = false, onTogglePin, onShare, onOpenStory }: { postId: string; onShare?: () => void; /** Opens the photo-quote («عکس‌نوشت») studio for this post. */ onOpenStory?: () => void; onDelete?: () => void; /** Owner's own profile: pin to / unpin from the profile. */ pinned?: boolean; onTogglePin?: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const stop = (event: React.SyntheticEvent) => {
    // The timeline card is wrapped in a link.
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div ref={ref} className="pointer-events-auto relative">
      <button
        type="button"
        aria-label="گزینه‌های روایت"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          stop(event);
          setOpen((value) => !value);
        }}
        className={`${styles.more} grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors active:scale-95`}
      >
        <Ellipsis aria-hidden="true" className="h-4 w-4" />
      </button>
      {open ? (
        <div role="menu" className={`${styles.moreMenu} absolute left-0 top-9 z-40 min-w-40 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-dialog`}>
          {onOpenStory ? <button type="button" role="menuitem" onClick={(event) => { stop(event); setOpen(false); onOpenStory(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-bold hover:bg-hover"><FileImage aria-hidden="true" className="h-4 w-4" />تولید عکس‌نوشت</button> : null}
          {onShare ? <button type="button" role="menuitem" onClick={(event) => { stop(event); setOpen(false); onShare(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-bold hover:bg-hover"><Send aria-hidden="true" className="h-4 w-4" />اشتراک‌گذاری</button> : null}
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              stop(event);
              void navigator.clipboard?.writeText(`${window.location.origin}/posts/${postId}`).then(() => {
                setCopied(true);
                window.setTimeout(() => {
                  setCopied(false);
                  setOpen(false);
                }, 900);
              });
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-bold text-foreground hover:bg-hover"
          >
            <Link2 aria-hidden="true" className="h-4 w-4" />
            {copied ? "کپی شد" : "کپی پیوند روایت"}
          </button>
          {onTogglePin ? (
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                stop(event);
                setOpen(false);
                onTogglePin();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-bold text-foreground hover:bg-hover"
            >
              {pinned ? <PinOff aria-hidden="true" className="h-4 w-4" /> : <Pin aria-hidden="true" className="h-4 w-4" />}
              {pinned ? "برداشتن سنجاق از نمایه" : "سنجاق در نمایه"}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                stop(event);
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-bold text-danger-foreground hover:bg-danger-surface"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              حذف روایت
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
