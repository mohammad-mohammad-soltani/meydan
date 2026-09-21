"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";

export function DeletePostDialog({
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-post-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog" dir="rtl">
        <h2 id="delete-post-title" className="text-sm font-black text-foreground">حذف روایت</h2>
        <p className="mt-2 text-xs leading-6 text-foreground-secondary">
          این روایت از میدان حذف می‌شود. آیا مطمئن هستید؟
        </p>
        {error ? <p role="alert" className="mt-3 text-xs font-bold leading-6 text-danger">{error}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-control border border-border bg-surface px-4 text-xs font-black text-foreground-secondary transition-colors hover:bg-hover disabled:opacity-60"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-danger px-4 text-xs font-black text-on-solid transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            {busy ? "در حال حذف…" : "حذف روایت"}
          </button>
        </div>
      </div>
    </div>
  );
}
