"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CircleCheckBig,
  FileText,
  Headphones,
  Image as ImageIcon,
  LoaderCircle,
  Newspaper,
  Play,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { useViewerRole } from "@/features/auth/hooks/useViewerRole";
import { MeydanApiError, meydanApi } from "@/lib/meydan-api";
import type { PostMedia } from "../types";
import { suggestedContentTitle } from "../services/content-title";

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

/** Content types accepted by `POST /admin/narratives/{id}/content`. */
const CONTENT_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "placard", label: "پلاکارد" },
  { value: "speech", label: "سخنرانی" },
  { value: "music_video", label: "نماهنگ" },
  { value: "video", label: "ویدیو" },
  { value: "report", label: "گزارش" },
];

const DEFAULT_CONTENT_TYPE = "report";

function contentTypeLabel(value?: string | null): string {
  if (!value) return "";
  return (
    CONTENT_TYPES.find((type) => type.value === value)?.label || value
  );
}

function ContentFormatPicker({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 w-full text-right">
      <label
        htmlFor="post-admin-content-type"
        className="mb-1.5 block text-[11px] font-bold text-foreground-subtle"
      >
        نوع محتوا
      </label>

      <select
        id="post-admin-content-type"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-xs font-black text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        {CONTENT_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ContentTitleInput({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <div className="mt-4 w-full text-right">
      <label htmlFor="post-admin-content-title" className="mb-1.5 block text-[11px] font-bold text-foreground-subtle">
        عنوان محتوا
      </label>
      <input
        id="post-admin-content-title"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        maxLength={120}
        className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-xs font-black text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

const primaryIcons = { image: ImageIcon, video: Play, microphone: Headphones, article: FileText };

function PrimaryAttachmentPicker({ media, value, disabled, onChange }: { media: PostMedia[]; value: string | null; disabled: boolean; onChange: (value: string) => void }) {
  if (!media.length) return null;
  return (
    <fieldset className="mt-4 w-full text-right">
      <legend className="mb-1.5 text-[11px] font-bold text-foreground-subtle">فایل اصلی</legend>
      <p className="mb-2 text-[10px] leading-5 text-muted-foreground">نمای بالای صفحهٔ محتوا با این فایل ساخته می‌شود.</p>
      <div className="space-y-2">
        {media.map((item) => {
          const Icon = primaryIcons[item.kind];
          return <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-control border p-2.5 transition-colors ${value === item.id ? "border-brand bg-brand-muted" : "border-border bg-surface hover:bg-hover"}`}>
            <input type="radio" name="primary-attachment" value={item.id} checked={value === item.id} disabled={disabled} onChange={() => onChange(item.id)} className="accent-brand" />
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-muted text-icon-muted"><Icon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-[11px] font-black">{item.label}</strong><small className="block text-[10px] text-muted-foreground">{item.kind === "video" ? "ویدیو" : item.kind === "microphone" ? "صوت" : item.kind === "image" ? "تصویر" : "فایل"}</small></span>
          </label>;
        })}
      </div>
    </fieldset>
  );
}

function AdminConfirmDialog({
  action,
  isSaving,
  error,
  onCancel,
  onConfirm,
  children,
}: {
  action: AdminAction;
  isSaving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
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

          {children}

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
  contentId,
  media,
  body,
}: {
  postId: string;
  editorial: boolean;
  isContent: boolean;
  contentId?: number | null;
  media: PostMedia[];
  body: string;
}) {
  const { isAuthenticated } = useAuthGate();
  const { isAdministrator, isLoading } = useViewerRole(isAuthenticated);

  const [editorialOverride, setEditorialOverride] = useState<boolean | null>(
    null,
  );
  const [contentOverride, setContentOverride] = useState<boolean | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>(
    DEFAULT_CONTENT_TYPE,
  );
  const [currentContentType, setCurrentContentType] = useState<string | null>(null);
  const [primaryAttachmentId, setPrimaryAttachmentId] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState("");
  const [pendingAction, setPendingAction] = useState<AdminAction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // The server values win until an action in this session overrides them.
  const isMarked = editorialOverride ?? editorial;
  const isPublished = contentOverride ?? isContent;

  /*
   * The narrative payload only links the content id, so the stored content type is
   * read from the public content endpoint once the conversion exists.
   */
  useEffect(() => {
    if (!isAuthenticated || !isPublished || !contentId) return;

    let active = true;

    void meydanApi<{ content_type?: string }>(`/content/${contentId}`)
      .then((content) => {
        if (active && content.content_type) setCurrentContentType(content.content_type);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [isAuthenticated, isPublished, contentId]);

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
        if (publish && !contentTitle.trim()) {
          setError("عنوان محتوا را وارد کنید.");
          return;
        }
        if (publish && media.length > 0 && !primaryAttachmentId) {
          setError("فایل اصلی محتوا را انتخاب کنید.");
          return;
        }

        const result = await meydanApi<{
          id?: number;
          content_type?: string;
          deleted?: boolean;
        }>(
          `/admin/narratives/${postId}/content`,
          publish
            ? {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ title: contentTitle.trim(), content_type: selectedContentType, ...(primaryAttachmentId ? { primary_attachment_id: Number(primaryAttachmentId) } : {}) }),
              }
            : { method: "DELETE" },
        );

        setContentOverride(publish);

        if (publish) {
          const saved = result.content_type || selectedContentType;
          setCurrentContentType(saved);
          setNotice(
            `روایت به عنوان محتوا (${contentTypeLabel(saved)}) منتشر شد.`,
          );
        } else {
          setCurrentContentType(null);
          setNotice("روایت از محتوا حذف شد.");
        }
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
            if (!isPublished) {
              setPrimaryAttachmentId(null);
              setContentTitle(suggestedContentTitle(body, Number(postId)));
            }
            setPendingAction(isPublished ? "removeContent" : "publishContent");
          }}
          aria-haspopup="dialog"
          title={
            isPublished
              ? currentContentType
                ? `حذف از محتوا (${contentTypeLabel(currentContentType)})`
                : "حذف از محتوا"
              : "انتشار به عنوان محتوا"
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
          {isPublished
            ? currentContentType
              ? `منتشرشده · ${contentTypeLabel(currentContentType)}`
              : "منتشرشده به عنوان محتوا"
            : "انتشار به عنوان محتوا"}
        </button>
      </div>

      {pendingAction ? (
        <AdminConfirmDialog
          action={pendingAction}
          isSaving={isSaving}
          error={error}
          onCancel={closeDialog}
          onConfirm={() => void applyAction(pendingAction)}
        >
          {pendingAction === "publishContent" ? (
            <>
              <ContentTitleInput value={contentTitle} disabled={isSaving} onChange={setContentTitle} />
              <ContentFormatPicker
                value={selectedContentType}
                disabled={isSaving}
                onChange={setSelectedContentType}
              />
              <PrimaryAttachmentPicker media={media} value={primaryAttachmentId} disabled={isSaving} onChange={setPrimaryAttachmentId} />
            </>
          ) : null}

          {pendingAction === "removeContent" ? (
            <div className="mt-4 w-full space-y-1.5 rounded-control bg-surface-muted px-3 py-2.5 text-right">
              {currentContentType ? (
                <p className="text-[11px] font-bold text-foreground-secondary">
                  نوع فعلی محتوا:{" "}
                  <span className="text-foreground">
                    {contentTypeLabel(currentContentType)}
                  </span>
                </p>
              ) : null}

              <p className="text-[10px] leading-5 text-foreground-subtle">
                برای تغییر نوع، ابتدا حذف کنید و سپس دوباره با نوع دلخواه منتشر
                کنید.
              </p>
            </div>
          ) : null}
        </AdminConfirmDialog>
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
