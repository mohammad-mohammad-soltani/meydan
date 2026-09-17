"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, LoaderCircle, X } from "lucide-react";

/**
 * The project's only feedback pattern: an inline message with a live role.
 * Errors get `role="alert"` (announced immediately), everything else
 * `role="status"`.
 */
export type AdminNoticeTone = "success" | "error" | "info" | "loading";

const TONES: Record<AdminNoticeTone, { wrap: string; icon: string }> = {
  success: { wrap: "border-success-border bg-success-surface text-success-foreground", icon: "text-success" },
  error: { wrap: "border-danger-border bg-danger-surface text-danger-foreground", icon: "text-danger" },
  info: { wrap: "border-info-border bg-info-surface text-info-foreground", icon: "text-info" },
  loading: { wrap: "border-border bg-surface-muted text-foreground-secondary", icon: "text-icon-muted" },
};

function ToneIcon({ tone, className }: { tone: AdminNoticeTone; className?: string }) {
  if (tone === "success") return <CheckCircle2 aria-hidden="true" className={className} />;
  if (tone === "error") return <AlertTriangle aria-hidden="true" className={className} />;
  if (tone === "loading") return <LoaderCircle aria-hidden="true" className={`${className} animate-spin`} />;
  return <Info aria-hidden="true" className={className} />;
}

export function AdminNotice({
  tone = "info",
  message,
  /** Auto-hides a success notice; errors stay until dismissed. */
  autoHideMs,
  onDismiss,
  className = "",
}: {
  tone?: AdminNoticeTone;
  message: string;
  autoHideMs?: number;
  onDismiss?: () => void;
  className?: string;
}) {
  // The dismissed *message* is stored rather than a boolean, so a new message
  // re-arms the notice by itself: no effect has to reset a flag when `message`
  // changes, which would otherwise be a setState-in-effect cascade.
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const dismissed = dismissedMessage !== null && dismissedMessage === message;

  useEffect(() => {
    if (!autoHideMs || tone === "error") return;
    const timer = window.setTimeout(() => {
      setDismissedMessage(message);
      onDismiss?.();
    }, autoHideMs);
    return () => window.clearTimeout(timer);
  }, [autoHideMs, onDismiss, tone, message]);

  if (dismissed) return null;

  const styles = TONES[tone];
  const role = tone === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`flex items-start gap-2 rounded-control border px-3 py-2.5 text-xs font-bold leading-6 ${styles.wrap} ${className}`}
    >
      <ToneIcon tone={tone} className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`} />
      <span className="min-w-0 flex-1">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={() => {
            setDismissedMessage(message);
            onDismiss();
          }}
          aria-label="بستن پیام"
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full opacity-70 transition-opacity hover:opacity-100"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Server-rejected form fields. `fields` is the API's `error.fields` map
 * (`{ phone: "taken" }`); this renders the summary above the form once, so a
 * 422 never scrolls past unnoticed.
 */
export function AdminFormError({
  message,
  fields,
  fieldMessages,
}: {
  message: string;
  fields?: Record<string, string>;
  /** Rendered as `فیلد: دلیل` under the summary. */
  fieldMessages?: Record<string, string>;
}) {
  const entries = Object.entries(fields ?? {});
  const details = entries
    .map(([field, reason]) => {
      const text = fieldMessages?.[field] ?? reason;
      return `${field}: ${text}`;
    })
    .join(" · ");

  return (
    <AdminNotice
      tone="error"
      message={details ? `${message} (${details})` : message}
    />
  );
}
