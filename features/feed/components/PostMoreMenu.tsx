"use client";

import { Ellipsis, Link2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** The «…» menu in a post header: copy link, and delete when the viewer may. */
export function PostMoreMenu({ postId, onDelete }: { postId: string; onDelete?: () => void }) {
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
    <div ref={ref} className="pointer-events-auto relative z-20">
      <button
        type="button"
        aria-label="گزینه‌های روایت"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          stop(event);
          setOpen((value) => !value);
        }}
        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-hover hover:text-foreground active:scale-95"
      >
        <Ellipsis aria-hidden="true" className="h-4 w-4" />
      </button>
      {open ? (
        <div role="menu" className="absolute left-0 top-9 z-30 min-w-40 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-dialog">
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
