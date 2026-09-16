"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CircleCheckBig,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { useViewerRole } from "@/features/auth/hooks/useViewerRole";
import { MeydanApiError, meydanApi } from "@/lib/meydan-api";

type ConfirmMode = "mark" | "unmark";

const WARNING_MESSAGE =
  "این عمل ممکن است این پست را در رسانه‌های دیگر نشر دهد";

function EditorialConfirmDialog({
  mode,
  isSaving,
  error,
  onCancel,
  onConfirm,
}: {
  mode: ConfirmMode;
  isSaving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  if (typeof document === "undefined") return null;

  const isMark = mode === "mark";
  const accentSurface = isMark ? "bg-warning-surface" : "bg-danger-surface";
  const accentText = isMark ? "text-warning-foreground" : "text-danger-foreground";
  const confirmClass = isMark
    ? "bg-warning text-warning-solid-foreground hover:opacity-90"
    : "bg-danger text-on-solid hover:opacity-90";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="editorial-confirm-title"
      aria-describedby="editorial-confirm-message"
      dir="rtl"
      className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-overlay p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section className="w-full max-w-sm overflow-hidden rounded-panel border border-border bg-background text-foreground shadow-dialog">
        <div className="flex flex-col items-center px-5 pt-6 text-center">
          <span
            aria-hidden="true"
            className={`grid h-14 w-14 place-items-center rounded-full ${accentSurface} ${accentText}`}
          >
            {isMark ? (
              <TriangleAlert className="h-7 w-7" />
            ) : (
              <ShieldCheck className="h-7 w-7" />
            )}
          </span>

          <h2
            id="editorial-confirm-title"
            className="mt-3 text-lg font-black text-foreground"
          >
            {isMark ? "هشدار" : "حذف از سردبیری"}
          </h2>

          <p
            id="editorial-confirm-message"
            className="mt-2 text-[13px] leading-7 text-foreground-secondary"
          >
            {isMark
              ? WARNING_MESSAGE
              : "این پست از فهرست روایت‌های سردبیری‌شده حذف می‌شود."}
          </p>

          {error ? (
            <p
              role="alert"
              className="mt-3 w-full rounded-control bg-danger-surface px-3 py-2 text-[11px] font-bold leading-6 text-danger-foreground"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-divider bg-surface-muted/40 p-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-background px-4 text-xs font-black text-foreground-secondary outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control px-4 text-xs font-black outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70 ${confirmClass}`}
          >
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : null}
            {isMark ? "تأیید" : "حذف"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/**
 * Administrator-only action shown on a narrative's single page that adds the
 * narrative to the editorial collection (and removes it again).
 *
 * The component renders nothing for guests, signed-in non-admins and while the
 * viewer role is still loading, so the backend stays the single source of
 * truth for the `administrator` role.
 */
export function PostEditorialMark({
  postId,
  editorial,
}: {
  postId: string;
  editorial: boolean;
}) {
  const { isAuthenticated } = useAuthGate();
  const { isAdministrator, isLoading } = useViewerRole(isAuthenticated);

  const [markedOverride, setMarkedOverride] = useState<boolean | null>(null);
  const [mode, setMode] = useState<ConfirmMode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // The server value wins until an action in this session overrides it.
  const isMarked = markedOverride ?? editorial;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const closeDialog = useCallback(() => {
    if (isSaving) return;
    setMode(null);
    setError("");
  }, [isSaving]);

  const applyEditorial = async (next: boolean) => {
    if (isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      const result = await meydanApi<{ id?: number; editorial?: boolean }>(
        `/admin/narratives/${postId}/editorial`,
        { method: next ? "PUT" : "DELETE" },
      );

      setMarkedOverride(result.editorial ?? next);
      setMode(null);
      setNotice(
        next
          ? "روایت به سردبیری اضافه شد."
          : "روایت از سردبیری حذف شد.",
      );
    } catch (reason) {
      setError(
        reason instanceof MeydanApiError && reason.message
          ? reason.message
          : "انجام این عملیات ممکن نشد. دوباره تلاش کنید.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || isLoading || !isAdministrator) return null;

  return (
    <>
      <div dir="rtl" className="flex items-center gap-2 px-4 pb-1 pt-2.5">
        <button
          type="button"
          onClick={() => {
            setError("");
            setMode(isMarked ? "unmark" : "mark");
          }}
          aria-haspopup="dialog"
          title={isMarked ? "حذف از سردبیری" : "افزودن به سردبیری"}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[11px] font-black leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
            isMarked
              ? "border-success-border bg-success-surface text-success-foreground hover:border-success"
              : "border-warning-border bg-warning-surface text-warning-foreground hover:border-warning"
          }`}
        >
          {isMarked ? (
            <CircleCheckBig aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          {isMarked ? "سردبیری شده" : "نشانه‌گذاری سردبیری"}
        </button>
      </div>

      {mode ? (
        <EditorialConfirmDialog
          mode={mode}
          isSaving={isSaving}
          error={error}
          onCancel={closeDialog}
          onConfirm={() => void applyEditorial(mode === "mark")}
        />
      ) : null}

      <p
        role="status"
        aria-live="polite"
        className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-solid-dark px-4 py-2.5 text-center text-xs font-bold text-on-solid shadow-dialog transition lg:bottom-5 ${
          notice
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <CircleCheckBig aria-hidden="true" className="h-4 w-4 text-success" />
          {notice || "انجام شد"}
        </span>
      </p>
    </>
  );
}
