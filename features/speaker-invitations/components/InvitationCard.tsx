"use client";

import Image from "next/image";
import { Check, LoaderCircle, MapPin, Phone, CalendarDays, X } from "lucide-react";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import type { InvitationActor, SpeakerInvitation } from "../types";

const statusStyles: Record<SpeakerInvitation["status"], string> = {
  pending: "bg-warning-surface text-warning-foreground",
  accepted: "bg-success-surface text-success-foreground",
  rejected: "bg-danger-surface text-danger-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const statusLabels: Record<SpeakerInvitation["status"], string> = {
  pending: "در انتظار پاسخ",
  accepted: "پذیرفته‌شده",
  rejected: "رد‌شده",
  cancelled: "لغو‌شده",
};

function ActorAvatar({ actor }: { actor: InvitationActor | null }) {
  const initials = actor?.name?.trim().slice(0, 1) || "؟";

  if (actor?.avatarUrl) {
    return (
      <Image
        src={actor.avatarUrl}
        alt=""
        width={44}
        height={44}
        unoptimized={actor.avatarUrl.startsWith("http")}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-border/70"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-black text-icon"
    >
      {initials}
    </span>
  );
}

function when(invitation: SpeakerInvitation): string {
  const parts = [invitation.requestedDate, invitation.requestedTime].filter(Boolean);
  return parts.join(" · ");
}

export function InvitationCard({
  invitation,
  perspective,
  busy,
  onAccept,
  onReject,
}: {
  invitation: SpeakerInvitation;
  /** Whose side of the invitation this card shows. */
  perspective: "speaker" | "inviter";
  busy?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const counterpart = perspective === "speaker" ? invitation.inviter : invitation.speaker;
  const counterpartRole = perspective === "speaker" ? "دعوت‌کننده" : "سخنران";
  const scheduled = when(invitation);
  const canDecide = perspective === "speaker" && invitation.status === "pending";

  return (
    <article className="rounded-card border border-border bg-card p-3 text-right shadow-xs">
      <div className="flex gap-3">
        <ActorAvatar actor={counterpart} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1">
                <strong className="truncate text-xs font-black text-foreground">
                  {counterpart?.name || "کاربر میدان"}
                </strong>
                <SpeakerBadge verified={counterpart?.verifiedSpeaker} />
              </div>
              <p className="mt-0.5 text-[10px] text-foreground-subtle">{counterpartRole}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[invitation.status]}`}>
              {statusLabels[invitation.status]}
            </span>
          </div>

          <dl className="mt-2 space-y-1 text-[11px] text-foreground-secondary">
            {invitation.location ? (
              <div className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-icon-muted" />
                <dd className="truncate">{invitation.location}</dd>
              </div>
            ) : null}
            {scheduled ? (
              <div className="flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-icon-muted" />
                <dd className="truncate" dir="ltr">{scheduled}</dd>
              </div>
            ) : null}
            {invitation.message ? (
              <p className="line-clamp-2 leading-5 text-foreground-subtle">{invitation.message}</p>
            ) : null}
          </dl>

          {/* Contact details are released by the API only after acceptance. */}
          {perspective === "inviter" && invitation.phoneVisible && invitation.speaker?.phone ? (
            <a
              href={`tel:${invitation.speaker.phone}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-surface px-2.5 py-1 text-[11px] font-bold text-success-foreground transition-colors hover:opacity-90"
            >
              <Phone aria-hidden="true" className="h-3.5 w-3.5" />
              <span dir="ltr">{invitation.speaker.phone}</span>
            </a>
          ) : null}

          {perspective === "inviter" && invitation.status === "accepted" && !invitation.speaker?.phone ? (
            <p className="mt-2 text-[10px] text-foreground-subtle">شماره تماس سخنران پس از پذیرش در دسترس است.</p>
          ) : null}

          {canDecide ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onAccept}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-control bg-success px-3 text-[11px] font-black text-on-solid transition-colors hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                قبول دعوت
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onReject}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-control border border-danger-border bg-danger-surface px-3 text-[11px] font-black text-danger-foreground transition-colors hover:opacity-90 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" />
                رد دعوت
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
