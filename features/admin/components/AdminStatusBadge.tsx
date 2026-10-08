import {
  SQUARE_STATUS_LABELS,
  SPEAKER_REQUEST_STATUS_LABELS,
  PROGRAM_STATUS_LABELS,
  type ProgramStatus,
  type SpeakerRequestStatus,
  type SquareStatus,
} from "../types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-border bg-surface-muted text-foreground-secondary",
  success: "border-success-border bg-success-surface text-success-foreground",
  warning: "border-warning-border bg-warning-surface text-warning-foreground",
  danger: "border-danger-border bg-danger-surface text-danger-foreground",
  info: "border-info-border bg-info-surface text-info-foreground",
};

const SQUARE_TONES: Record<SquareStatus, Tone> = {
  pending_verification: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "neutral",
};

const REQUEST_TONES: Record<SpeakerRequestStatus, Tone> = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const PROGRAM_TONES: Record<ProgramStatus, Tone> = {
  draft: "neutral",
  active: "success",
  ended: "info",
  disabled: "danger",
};

function Badge({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={`admin-status-badge inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-bold ${TONE_CLASS[tone]}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
      />
      {children}
    </span>
  );
}

export function SquareStatusBadge({ status }: { status: SquareStatus }) {
  return (
    <Badge tone={SQUARE_TONES[status] ?? "neutral"}>
      {SQUARE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function SpeakerRequestStatusBadge({
  status,
}: {
  status: SpeakerRequestStatus;
}) {
  return (
    <Badge tone={REQUEST_TONES[status] ?? "neutral"}>
      {SPEAKER_REQUEST_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function ProgramStatusBadge({ status }: { status: string }) {
  const known = status as ProgramStatus;
  return (
    <Badge tone={PROGRAM_TONES[known] ?? "neutral"}>
      {PROGRAM_STATUS_LABELS[known] ?? status}
    </Badge>
  );
}

/**
 * WordPress post status. The admin API can return any of `publish`, `draft`,
 * `pending`, `future` or `private`, so unknown values fall back to their raw
 * slug rather than an invented label.
 */
const POST_STATUS_LABELS: Record<string, { label: string; tone: Tone }> = {
  publish: { label: "منتشرشده", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "neutral" },
  pending: { label: "در انتظار بازبینی", tone: "warning" },
  future: { label: "زمان‌بندی‌شده", tone: "info" },
  private: { label: "خصوصی", tone: "neutral" },
  trash: { label: "زباله‌دان", tone: "danger" },
};

export function PostStatusBadge({ status }: { status: string }) {
  const known = POST_STATUS_LABELS[status];
  return (
    <Badge tone={known?.tone ?? "neutral"}>{known?.label ?? status}</Badge>
  );
}

/**
 * The WordPress-side "verified" flag, used by squares, speakers and creators.
 *
 * It is a different concept from `SquareStatus.approved`, and the two were
 * previously rendered with the same word ("تأییدشده"), so an approved square
 * showed the identical badge twice in one row. This carries a leading tick so
 * the pair reads as "approved, and also verified".
 */
export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Badge tone={verified ? "success" : "neutral"}>
      {verified ? "✓ نشان‌دار" : "بدون نشان"}
    </Badge>
  );
}

const APPLICATION_TONES = { pending: "warning", approved: "success", rejected: "danger" } as const;
const APPLICATION_LABELS = { pending: "در انتظار بررسی", approved: "تأییدشده", rejected: "ردشده" } as const;

export function SpeakerApplicationStatusBadge({ status }: { status: keyof typeof APPLICATION_TONES }) {
  return <Badge tone={APPLICATION_TONES[status]}>{APPLICATION_LABELS[status]}</Badge>;
}
