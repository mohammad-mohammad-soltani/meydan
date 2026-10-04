"use client";

import { FollowListSheet } from "./FollowListSheet";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { ArrowRight, Bell, BellRing, CalendarDays, Camera, Check, LoaderCircle, Mail, MapPin, Pencil, Share2, UserRoundPlus } from "lucide-react";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { MEDIA_THUMB_QUALITY } from "@/features/media/media-utils";
import { SpeakerInviteButton } from "@/features/speaker-invitations/components/SpeakerInviteButton";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { ProfileActionsMenu, shareProfile } from "./ProfileActionsMenu";
import { meydanApi } from "@/lib/meydan-api";
import { ENTITY_KIND_LABELS, actorKindOf, isEntityKind } from "@/lib/profile-route";
import { AdminNavLink } from "@/components/layouts/AdminNavLink";
import type { ProfileDetails } from "../types";
import { AccountBadges } from "@/components/shared/AccountBadges";

type ProfileHeaderProps = {
  profile: ProfileDetails;
  /** Cover bell: «اعلان‌های نمایه» for this account. */
  isNotifying?: boolean;
  onToggleNotify?: () => Promise<boolean | undefined>;
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

type FollowedBy = { count: number; actors: Array<{ display_name?: string; avatar_url?: string }> };

const number = new Intl.NumberFormat("fa-IR");
const compact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const persianMonth = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long" });
const persianYear = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" });
/** «مهر ۱۴۰۲»: month first, as in the reference (the locale puts the year first). */
const monthYear = { format: (date: Date) => `${persianMonth.format(date)} ${persianYear.format(date).replace(/\s*ه\.ش\.?/, "")}` };

const plain = "grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10 active:scale-95";
const glass = "grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50 active:scale-95";

/**
 * Profile header in the reference design: cover with glass controls, the
 * avatar centred between the follower and post counts, centred identity and
 * bio, info chips, two equal actions and «دنبال‌شده توسط …».
 */
export function ProfileHeader({ profile, isNotifying = false, onToggleNotify, canEdit = false, isFollowing = false, isFollowLoading = false, followStateReady = true, isChatOpening = false, onToggleFollow, onMessage, canInvite = false, inviteVenue = "" }: ProfileHeaderProps) {
  const { requireAuth, isAuthenticated } = useAuthGate();
  const [notice, setNotice] = useState("");
  // Toasts fade on their own; before, a copied-link notice stayed on screen.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const [followedBy, setFollowedBy] = useState<FollowedBy | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const { identity, accountType, narratives } = profile;
  const kind = accountType === "square" ? profile.kind ?? "square" : "user";
  const canBeInvited = !canEdit && accountType !== "square" && Boolean(identity.isSpeaker || identity.verifiedSpeaker);
  const posts = profile.narrativeCount ?? narratives.length;
  const followers = profile.social?.followers;
  const joined = profile.social?.joinedAt ? monthYear.format(new Date(profile.social.joinedAt)) : null;
  const kindLabel = accountType === "square" && isEntityKind(profile.kind) ? ENTITY_KIND_LABELS[profile.kind] : null;
  // A short headline reads as a role chip; a long one is the bio line (when there is no «درباره»).
  const shortSubtitle = identity.subtitle && identity.subtitle.length <= 40 ? identity.subtitle : "";
  const bio = profile.about || (shortSubtitle ? "" : identity.subtitle);
  const chips = [
    ...(kindLabel ? [{ key: "kind", label: kindLabel, strong: true }] : []),
    ...(shortSubtitle ? [{ key: "subtitle", label: shortSubtitle, strong: true }] : []),
    ...(accountType === "square" ? profile.squareStats : [])
      .filter((stat) => stat.value && stat.value !== "…")
      .slice(1, 3)
      .map((stat) => ({ key: `stat-${stat.label}`, label: `${stat.value} ${stat.label}`, strong: false })),
    ...profile.skills.slice(0, 4).map((skill) => ({ key: `skill-${skill}`, label: `#${skill.replace(/^#/, "")}`, strong: false })),
  ];

  // Only signed-in visitors of someone else's profile see «followed by»; one small request.
  useEffect(() => {
    if (canEdit || !isAuthenticated) return;
    let active = true;
    void meydanApi<FollowedBy>(`/actors/${kind}/${profile.actorId}/followed-by`)
      .then((value) => active && setFollowedBy(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [canEdit, isAuthenticated, kind, profile.actorId]);

  return (
    <>
      <div className="relative">
        <div className="relative h-48 overflow-hidden rounded-b-[2rem] bg-surface-elevated">
          {identity.cover ? (
            <Image src={identity.cover} alt={`کاور ${identity.name}`} fill priority quality={MEDIA_THUMB_QUALITY} sizes="(max-width: 720px) 100vw, 640px" className="object-cover" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,#e4152e,#f5525f)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        </div>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <button type="button" aria-label="بازگشت" onClick={() => history.back()} className={glass}>
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-0.5 rounded-full border border-white/15 bg-black/35 p-0.5 backdrop-blur-md">
            {canEdit ? <AdminNavLink isAuthenticated className={`${glass} !w-auto px-3 text-xs font-black lg:hidden`} /> : null}
            {!canEdit && isAuthenticated && onToggleNotify ? (
              <button
                type="button"
                aria-label="اعلان‌های نمایه"
                aria-pressed={isNotifying}
                onClick={() => void onToggleNotify().then((on) => { if (on !== undefined) setNotice(on ? "اعلان‌های نمایه فعال شد" : "اعلان‌های نمایه خاموش شد"); })}
                className={isNotifying ? "grid h-10 w-10 place-items-center rounded-full bg-emphasis text-emphasis-foreground transition active:scale-95" : plain}
              >
                {isNotifying ? <BellRing className="h-[18px] w-[18px]" /> : <Bell className="h-[18px] w-[18px]" />}
              </button>
            ) : null}
            <button type="button" aria-label="اشتراک‌گذاری نمایه" onClick={() => void shareProfile(profile, setNotice)} className={plain}>
              <Share2 className="h-[18px] w-[18px]" />
            </button>
            <ProfileActionsMenu profile={profile} canEdit={canEdit} onNotice={setNotice} triggerClassName={plain} />
          </div>
        </div>
        {canEdit ? (
          <Link href={"/profile/edit" as Route} aria-label="تغییر کاور" className={`${glass} absolute bottom-3 left-3 h-9 w-9`}>
            <Camera className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="px-4 pb-5">
        <div className="-mt-14 grid grid-cols-[1fr_auto_1fr] items-end">
          <button type="button" onClick={() => setListOpen(true)} aria-label="فهرست دنبال‌کننده‌ها و دنبال‌شده‌ها" className="pb-0 text-center">
            <strong className="block text-lg font-black text-foreground">{followers === undefined ? "—" : followers >= 100_000 ? compact.format(followers) : number.format(followers)}</strong>
            <span className="text-[11px] text-muted-foreground">دنبال‌کننده</span>
          </button>
          <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-background bg-surface-muted text-3xl font-black text-foreground">
            {identity.avatar ? <OptimizedAvatar src={identity.avatar} alt={`آواتار ${identity.name}`} width={112} className="h-full w-full object-cover" /> : identity.name.slice(0, 1)}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border-2 border-foreground" />
          </div>
          <div className="pb-0 text-center">
            <strong className="block text-lg font-black text-foreground">{number.format(posts)}</strong>
            <span className="text-[11px] text-muted-foreground">روایت</span>
          </div>
        </div>

        <div className="mt-3 text-center">
          <h1 className="flex items-center justify-center gap-1.5 text-xl font-black leading-8 text-foreground">
            <span className="truncate">{identity.name}</span>
            <AccountBadges verified={identity.verified} speaker={identity.verifiedSpeaker} official={identity.verifiedOfficial} kind={kind} size="lg" />
          </h1>
          {identity.handle ? <p className="latin-digits mt-0.5 text-xs text-muted-foreground" dir="ltr">@{identity.handle}</p> : null}
          {bio ? <p className="mx-auto mt-3 max-w-md whitespace-pre-wrap text-[13px] leading-7 text-foreground-secondary">{bio}</p> : null}
        </div>

        {chips.length || identity.location || joined ? (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {chips.map((chip) => (
              <span key={chip.key} className={`rounded-full border border-border bg-surface-muted px-3 py-1 text-[11px] ${chip.strong ? "font-black text-foreground" : "text-muted-foreground"}`}>{chip.label}</span>
            ))}
            {identity.location ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-3 py-1 text-[11px] text-muted-foreground"><MapPin aria-hidden="true" className="h-3.5 w-3.5" />{identity.location}</span>
            ) : null}
            {joined ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-3 py-1 text-[11px] text-muted-foreground"><CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />عضویت از {joined}</span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {canEdit ? (
            <>
              <Link href={"/profile/edit" as Route} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emphasis text-sm font-black text-emphasis-foreground transition hover:opacity-90">
                <Pencil aria-hidden="true" className="h-4 w-4" />
                ویرایش نمایه
              </Link>
              {/* As in the reference: «پیام» beside «ویرایش نمایه»; on your own profile it opens your conversations. */}
              <Link href={"/chat" as Route} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-strong bg-transparent text-sm font-black text-foreground transition hover:bg-hover">
                <Mail aria-hidden="true" className="h-4 w-4" />
                پیام
              </Link>
            </>
          ) : (
            <>
              <button type="button" disabled={isFollowLoading || !followStateReady} onClick={() => { if (requireAuth()) onToggleFollow?.(); }} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-black transition disabled:cursor-wait disabled:opacity-70 ${isFollowing ? "border border-border-strong bg-surface-sunken text-foreground hover:bg-hover" : "bg-emphasis text-emphasis-foreground hover:opacity-90"}`}>
                {isFollowLoading || !followStateReady ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isFollowing ? <Check className="h-4 w-4" /> : <UserRoundPlus className="h-4 w-4" />}
                {isFollowing ? "دنبال می‌کنید" : "دنبال کردن"}
              </button>
              <button type="button" disabled={isChatOpening} onClick={() => { if (requireAuth()) onMessage?.(); }} aria-label="ارسال پیام" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-strong bg-transparent text-sm font-black text-foreground transition hover:bg-hover disabled:cursor-wait disabled:opacity-70">
                {isChatOpening ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                پیام
              </button>
            </>
          )}
        </div>
        {canBeInvited ? (
          <div className="mt-2.5">
            <SpeakerInviteButton
              speaker={{ userId: String(profile.actorId), name: identity.name, avatarUrl: identity.avatar, verifiedSpeaker: identity.verifiedSpeaker }}
              canInvite={canInvite}
              venue={inviteVenue}
              size="md"
              className="w-full justify-center"
            />
          </div>
        ) : null}

        {followedBy && followedBy.count > 0 ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex -space-x-2 space-x-reverse">
              {followedBy.actors.slice(0, 3).map((actor, index) => (
                <span key={index} className="grid h-5 w-5 place-items-center overflow-hidden rounded-full border border-background bg-surface-elevated text-[9px] font-black text-foreground">
                  {actor.avatar_url ? <OptimizedAvatar src={actor.avatar_url} alt="" width={20} className="h-full w-full object-cover" /> : (actor.display_name ?? "").slice(0, 1)}
                </span>
              ))}
            </span>
            <span>
              دنبال‌شده توسط {followedBy.actors[0]?.display_name ?? "دوستانتان"}
              {followedBy.count > 1 ? ` و ${number.format(followedBy.count - 1)} نفر دیگر` : ""}
            </span>
          </p>
        ) : null}
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
      {listOpen ? <FollowListSheet type={actorKindOf(kind)} id={Number(profile.actorId)} name={identity.name} handle={identity.handle} onClose={() => setListOpen(false)} /> : null}
    </>
  );
}
