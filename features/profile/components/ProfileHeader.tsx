"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { ArrowRight, BadgeCheck, Check, LoaderCircle, MessageCircle, UserRoundPlus } from "lucide-react";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import { SpeakerInviteButton } from "@/features/speaker-invitations/components/SpeakerInviteButton";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { ProfileActionsMenu } from "./ProfileActionsMenu";
import { AdminNavLink } from "@/features/admin/components/AdminNavLink";
import type { ProfileDetails } from "../types";

type ProfileHeaderProps = {
  profile: ProfileDetails;
  canEdit?: boolean;
  isFollowing?: boolean;
  isFollowLoading?: boolean;
  followStateReady?: boolean;
  isChatOpening?: boolean;
  onToggleFollow?: () => void;
  onMessage?: () => void;
  /** True when the viewer is a square account that may invite this speaker. */
  canInvite?: boolean;
  /** The inviting square's own venue, previewed in the composer. */
  inviteVenue?: string;
};

export function ProfileHeader({ profile, canEdit = false, isFollowing = false, isFollowLoading = false, followStateReady = true, isChatOpening = false, onToggleFollow, onMessage, canInvite = false, inviteVenue = "" }: ProfileHeaderProps) {
  const { requireAuth } = useAuthGate();
  const [notice, setNotice] = useState("");
  const { identity, accountType, narratives } = profile;
  const postLabel = accountType === "square" ? new Intl.NumberFormat("fa-IR").format(narratives.length) : profile.resumeStats[0]?.value || "۰";
  const canBeInvited = !canEdit && accountType !== "square" && Boolean(identity.verifiedSpeaker);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-divider bg-surface/95 px-3 backdrop-blur">
        <button type="button" aria-label="بازگشت" onClick={() => history.back()} className="grid h-11 w-11 place-items-center rounded-full text-icon hover:bg-hover"><ArrowRight className="h-5 w-5" /></button>
        <div className="min-w-0"><h1 className="flex min-w-0 items-center gap-1.5 text-sm font-black text-foreground"><span className="truncate">{identity.name}</span><SpeakerBadge verified={identity.verifiedSpeaker} /></h1><p className="mt-0.5 text-[11px] text-foreground-subtle">{postLabel} روایت</p></div>
      </header>

      <div className="bg-surface">
        <div className="relative h-36 overflow-hidden bg-gradient-to-l from-brand via-brand-hover to-solid-dark sm:h-48">{identity.cover ? <Image src={identity.cover} alt={`کاور ${identity.name}`} fill priority sizes="(max-width: 720px) 100vw, 640px" unoptimized={identity.cover.startsWith("http")} className="object-cover" /> : null}</div>
        <div className="relative px-4 pb-5">
          <div className="flex min-h-16 items-start justify-between">
            <div className="-mt-12 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-surface bg-surface-muted text-3xl font-black text-foreground sm:-mt-14 sm:h-28 sm:w-28">{identity.avatar ? <Image src={identity.avatar} alt={`آواتار ${identity.name}`} width={112} height={112} unoptimized={identity.avatar.startsWith("http")} className="h-full w-full object-cover" /> : identity.name.slice(0, 1)}</div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              {canEdit ? <><AdminNavLink isAuthenticated className="inline-flex min-h-10 items-center gap-1.5 rounded-pill border border-brand-border bg-brand-muted px-3 text-xs font-black text-brand hover:bg-selected lg:hidden" /><Link href={"/profile/edit" as Route} className="inline-flex min-h-10 items-center rounded-pill border border-border px-4 text-xs font-black text-foreground hover:bg-hover">ویرایش پروفایل</Link></> : (
                <>
                  <button type="button" disabled={isChatOpening} onClick={() => { if (requireAuth()) onMessage?.(); }} aria-label="ارسال پیام" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-pill border border-border bg-surface px-3 text-xs font-black text-foreground transition-colors hover:bg-hover disabled:cursor-wait disabled:opacity-70">
                    {isChatOpening ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                    پیام
                  </button>
                  <button type="button" disabled={isFollowLoading || !followStateReady} onClick={() => { if (requireAuth()) onToggleFollow?.(); }} className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-pill border px-4 text-xs font-black transition-colors disabled:cursor-wait disabled:opacity-70 ${isFollowing ? "border-border bg-surface-muted text-foreground-secondary hover:bg-hover" : "border-brand bg-brand text-brand-foreground hover:bg-brand-hover"}`}>
                    {isFollowLoading || !followStateReady ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isFollowing ? <Check className="h-4 w-4" /> : <UserRoundPlus className="h-4 w-4" />}
                    {isFollowing ? "دنبال می‌کنید" : "دنبال کردن"}
                  </button>
                  {canBeInvited ? (
                    <SpeakerInviteButton
                      speaker={{
                        userId: String(profile.actorId),
                        name: identity.name,
                        avatarUrl: identity.avatar,
                        verifiedSpeaker: identity.verifiedSpeaker,
                      }}
                      canInvite={canInvite}
                      venue={inviteVenue}
                      size="md"
                    />
                  ) : null}
                </>
              )}
              <ProfileActionsMenu profile={profile} canEdit={canEdit} onNotice={setNotice} />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex flex-wrap items-center gap-1.5"><h2 className="text-xl font-black leading-8 text-foreground">{identity.name}</h2>{identity.verified ? <BadgeCheck aria-label="حساب تأییدشده" className="h-5 w-5 fill-verified text-on-solid" /> : null}<SpeakerBadge verified={identity.verifiedSpeaker} size="lg" /></div>
            <p dir="ltr" className="mt-0.5 text-left text-sm text-foreground-subtle">@{identity.handle}</p>
          </div>
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-solid-dark px-4 py-2.5 text-center text-xs font-bold text-on-solid shadow-dialog transition lg:bottom-5 ${
          notice ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Check aria-hidden="true" className="h-4 w-4 text-success" />
          {notice || "انجام شد"}
        </span>
      </p>
    </>
  );
}
