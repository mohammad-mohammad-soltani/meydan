"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, Check, LoaderCircle, MapPin, Phone, X } from "lucide-react";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import type { InvitationActor, SpeakerInvitation } from "../types";

const statusStyles: Record<SpeakerInvitation["status"], string> = {
  pending: "bg-warning-surface text-warning-foreground",
  accepted: "bg-success-surface text-success-foreground",
  rejected: "bg-danger-surface text-danger-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const statusDotStyles: Record<SpeakerInvitation["status"], string> = {
  pending: "bg-warning",
  accepted: "bg-success",
  rejected: "bg-danger",
  cancelled: "bg-muted-foreground",
};

const statusLabels: Record<SpeakerInvitation["status"], string> = {
  pending: "در انتظار پاسخ",
  accepted: "پذیرفته‌شده",
  rejected: "رد‌شده",
  cancelled: "لغو‌شده",
};

/** `usr_9` / `sq_54` -> `/profile/user/9` (the public route needs the digits). */
function actorProfileHref(actor: InvitationActor | null): Route | null {
  const numericId = actor?.id?.match(/(\d+)$/)?.[1];
  if (!numericId) return null;
  return `/profile/${actor?.type === "square" ? "square" : "user"}/${numericId}` as Route;
}

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
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-muted text-xs font-black text-brand"
    >
      {initials}
    </span>
  );
}

function ActorIdentity({
  actor,
  role,
  asSpeaker,
}: {
  actor: InvitationActor | null;
  role: string;
  asSpeaker: boolean;
}) {
  const href = actorProfileHref(actor);
  const name = actor?.name || "کاربر میدان";

  const heading = (
    <span className="flex min-w-0 items-center gap-1">
      <strong className="truncate text-xs font-black text-foreground">{name}</strong>
      <SpeakerBadge verified={actor?.verifiedSpeaker} always={asSpeaker} />
    </span>
  );

  return (
    <>
      {href ? (
        <Link href={href} aria-label={`نمایه ${name}`} className="shrink-0">
          <ActorAvatar actor={actor} />
        </Link>
      ) : (
        <ActorAvatar actor={actor} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {href ? (
              <Link href={href} className="block min-w-0 transition-colors hover:text-brand">
                {heading}
              </Link>
            ) : (
              heading
            )}
            <p className="mt-0.5 text-[10px] text-foreground-subtle">{role}</p>
          </div>
        </div>
      </div>
    </>
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
    <article className="ui-enter overflow-hidden rounded-card border border-border bg-card text-right shadow-xs transition-colors hover:border-border-strong">
      <div className="flex items-center gap-3 p-3.5">
        <ActorIdentity actor={counterpart} role={counterpartRole} asSpeaker={perspective === "inviter"} />

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-[10px] font-black ${statusStyles[invitation.status]}`}
        >
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${statusDotStyles[invitation.status]}`} />
          {statusLabels[invitation.status]}
        </span>
      </div>

      <dl className="space-y-1.5 border-t border-divider bg-surface-muted/40 px-3.5 py-3 text-[11px] text-foreground-secondary">
        {invitation.location ? (
          <div className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand" />
            <dd className="truncate">{invitation.location}</dd>
          </div>
        ) : null}
        {scheduled ? (
          <div className="flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand" />
            <dd className="truncate" dir="ltr">
              {scheduled}
            </dd>
          </div>
        ) : null}
        {invitation.message ? (
          <p className="line-clamp-2 pt-0.5 leading-5 text-foreground-subtle">{invitation.message}</p>
        ) : null}
      </dl>

      {/* Contact details are released by the API only after acceptance. */}
      {perspective === "inviter" && invitation.phoneVisible && invitation.speaker?.phone ? (
        <div className="border-t border-divider px-3.5 py-2.5">
          <a
            href={`tel:${invitation.speaker.phone}`}
            className="inline-flex items-center gap-1.5 rounded-pill bg-success-surface px-3 py-1.5 text-[11px] font-black text-success-foreground transition-opacity hover:opacity-90"
          >
            <Phone aria-hidden="true" className="h-3.5 w-3.5" />
            <span dir="ltr">{invitation.speaker.phone}</span>
          </a>
        </div>
      ) : null}

      {perspective === "inviter" && invitation.status === "accepted" && !invitation.speaker?.phone ? (
        <p className="border-t border-divider px-3.5 py-2.5 text-[10px] text-foreground-subtle">
          شماره تماس سخنران پس از پذیرش در دسترس است.
        </p>
      ) : null}

      {canDecide ? (
        <div className="flex gap-2 border-t border-divider bg-surface-muted/40 px-3.5 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-control bg-brand px-3 text-[11px] font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {busy ? <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <Check aria-hidden="true" className="h-3.5 w-3.5" />}
            قبول دعوت
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-control border border-danger-border bg-danger-surface px-3 text-[11px] font-black text-danger-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            رد دعوت
          </button>
        </div>
      ) : null}
    </article>
  );
}
