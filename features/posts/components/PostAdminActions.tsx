"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CircleCheckBig,
  LoaderCircle,
  Newspaper,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { useViewerRole } from "@/features/auth/hooks/useViewerRole";
import { MeydanApiError, meydanApi } from "@/lib/meydan-api";

type AdminAction =
  | "markEditorial"
  | "unmarkEditorial"
  | "publishContent"
  | "removeContent";

type DialogTone = "warning" | "danger" | "brand";

type DialogConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: DialogTone;
  icon: ReactNode;
};

const TONE_CLASSES: Record<
  DialogTone,
  { surface: string; confirm: string }
> = {
  warning: {
    surface: "bg-warning-surface text-warning-foreground",
    confirm: "bg-warning text-warning-solid-foreground hover:opacity-90",
  },
  danger: {
    surface: "bg-danger-surface text-danger-foreground",
    confirm: "bg-danger text-on-solid hover:opacity-90",
  },
  brand: {
    surface: "bg-brand-muted text-brand",
    confirm: "bg-brand text-brand-foreground hover:bg-brand-hover",
  },
};

const DIALOGS: Record<AdminAction, DialogConfig> = {
  markEditorial: {
    title: "هشدار",
    message: "این عمل ممکن است این پست را در رسانه‌های دیگر نشر دهد",
    confirmLabel: "تأیید",
    tone: "warning",
    icon: <TriangleAlert className="h-7 w-7" />,
  },
  unmarkEditorial: {
    title: "حذف از سردبیری",
    message: "این پست از فهرست روایت‌های سردبیری‌شده حذف می‌شود.",
    confirmLabel: "حذف",
    tone: "danger",
    icon: <ShieldCheck className="h-7 w-7" />,
  },
  publishContent: {
    title: "هشدار",
    message: "این عمل پست را به عنوان محتوا منتشر می‌کند",
    confirmLabel: "تأیید",
    tone: "warning",
    icon: <TriangleAlert className="h-7 w-7" />,
  },
  removeContent: {
    title: "حذف از محتوا",
    message:
      "این پست از محتوا حذف می‌شود و روایت به حالت عادی برمی‌گردد.",
    confirmLabel: "حذف",
    tone: "danger",
    icon: <Newspaper className="h-7 w-7" />,
  },
};

function AdminConfirmDialog({
  action,
  isSaving,
  error,
  onCancel,
  onConfirm,
}: {
  action: AdminAction;
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

  const config = DIALOGS[action];
  const tone = TONE_CLASSES[config.tone];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-admin-confirm-title"
      aria-describedby="post-admin-confirm-message"
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
            className={`grid h-14 w-14 place-items-center rounded-full ${tone.surface}`}
          >
            {config.icon}
          </span>

          <h2
            id="post-admin-confirm-title"
            className="mt-3 text-lg font-black text-foreground"
          >
            {config.title}
          </h2>

          <p
            id="post-admin-confirm-message"
            className="mt-2 text-[13px] leading-7 text-foreground-secondary"
          >
            {config.message}
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
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control px-4 text-xs font-black outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70 ${tone.confirm}`}
          >
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : null}
            {config.confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

const pillClass =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[11px] font-black leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

const idleEditorialPill =
  "border-warning-border bg-warning-surface text-warning-foreground hover:border-warning";
const activeEditorialPill =
  "border-success-border bg-success-surface text-success-foreground hover:border-success";

const idleContentPill =
  "border-brand-border bg-brand-muted text-brand hover:border-brand";
const activeContentPill =
  "border-success-border bg-success-surface text-success-foreground hover:border-success";

/**
 * Administrator-only actions shown on a narrative's single page:
 * adding/removing it from the editorial collection and publishing it as
 * standalone content.
 *
 * The component renders nothing for guests, signed-in non-admins and while the
 * viewer role is still loading, so the backend stays the single source of
 * truth for the `administrator` role.
 */
export function PostAdminActions({
  postId,
  editorial,
  isContent,
}: {
  postId: string;
  editorial: boolean;
  isContent: boolean;
}) {
  const { isAuthenticated } = useAuthGate();
  const { isAdministrator, isLoading } = useViewerRole(isAuthenticated);

  const [editorialOverride, setEditorialOverride] = useState<boolean | null>(
    null,
  );
  const [contentOverride, setContentOverride] = useState<boolean | null>(null);
  const [pendingAction, setPendingAction] = useState<AdminAction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // The server values win until an action in this session overrides them.
  const isMarked = editorialOverride ?? editorial;
  const isPublished = contentOverride ?? isContent;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const closeDialog = useCallback(() => {
    if (isSaving) return;
    setPendingAction(null);
    setError("");
  }, [isSaving]);

  const applyAction = async (action: AdminAction) => {
    if (isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      if (action === "markEditorial" || action === "unmarkEditorial") {
        const mark = action === "markEditorial";

        const result = await meydanApi<{ id?: number; editorial?: boolean }>(
          `/admin/narratives/${postId}/editorial`,
          { method: mark ? "PUT" : "DELETE" },
        );

        setEditorialOverride(result.editorial ?? mark);
        setNotice(
          mark
            ? "روایت به سردبیری اضافه شد."
            : "روایت از سردبیری حذف شد.",
        );
      } else {
        const publish = action === "publishContent";

        await meydanApi<{ id?: number; deleted?: boolean }>(
          `/admin/narratives/${postId}/content`,
          { method: publish ? "POST" : "DELETE" },
        );

        setContentOverride(publish);
        setNotice(
          publish
            ? "روایت به عنوان محتوا منتشر شد."
            : "روایت از محتوا حذف شد.",
        );
      }

      setPendingAction(null);
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
      <div
        dir="rtl"
        className="flex flex-wrap items-center gap-2 px-4 pb-1 pt-2.5"
      >
        <button
          type="button"
          onClick={() => {
            setError("");
            setPendingAction(isMarked ? "unmarkEditorial" : "markEditorial");
          }}
          aria-haspopup="dialog"
          title={isMarked ? "حذف از سردبیری" : "افزودن به سردبیری"}
          className={`${pillClass} ${
            isMarked ? activeEditorialPill : idleEditorialPill
          }`}
        >
          {isMarked ? (
            <CircleCheckBig aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          {isMarked ? "سردبیری شده" : "نشانه‌گذاری سردبیری"}
        </button>

        <button
          type="button"
          onClick={() => {
            setError("");
            setPendingAction(isPublished ? "removeContent" : "publishContent");
          }}
          aria-haspopup="dialog"
          title={
            isPublished ? "حذف از محتوا" : "انتشار به عنوان محتوا"
          }
          className={`${pillClass} ${
            isPublished ? activeContentPill : idleContentPill
          }`}
        >
          {isPublished ? (
            <CircleCheckBig aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <Newspaper aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          {isPublished ? "منتشرشده به عنوان محتوا" : "انتشار به عنوان محتوا"}
        </button>
      </div>

      {pendingAction ? (
        <AdminConfirmDialog
          action={pendingAction}
          isSaving={isSaving}
          error={error}
          onCancel={closeDialog}
          onConfirm={() => void applyAction(pendingAction)}
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
