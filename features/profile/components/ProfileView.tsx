"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, X } from "lucide-react";
import { ProfileActivity } from "./ProfileActivity";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInfo } from "./ProfileInfo";
import { SquareLocationCard } from "./SquareLocationCard";
import { SquareSchedule } from "./SquareSchedule";
import { useProfile } from "../hooks/useProfile";
import type { ProfileDetails } from "../types";

export function ProfileView({ initialProfile, canManage = true, canInvite = false, inviteVenue = "" }: { initialProfile: ProfileDetails; canManage?: boolean; /** Viewer is a square account allowed to invite this speaker. */ canInvite?: boolean; /** The inviting square's own venue, previewed in the composer. */ inviteVenue?: string }) {
  const profile = useProfile(initialProfile, canManage);
  const isSquare = profile.selectedTab === "square";
  const isSquareAccount = profile.profile.accountType === "square";
  const [name, setName] = useState(initialProfile.identity.name);
  const [subtitle, setSubtitle] = useState(initialProfile.identity.subtitle);
  const [about, setAbout] = useState(initialProfile.about);
  const [skills, setSkills] = useState(initialProfile.skills.join("، "));

  return (
    <section id="view-combined-profile" className="min-h-dvh bg-background pb-20 text-foreground">
      <div className="mx-auto w-full max-w-2xl border-x border-divider bg-surface">
        <ProfileHeader profile={profile.profile} canEdit={canManage} isFollowing={profile.isFollowing} isFollowLoading={profile.isFollowLoading} followStateReady={profile.followStateReady} isChatOpening={profile.isChatOpening} onToggleFollow={() => void profile.toggleFollowing()} onMessage={() => void profile.openChat()} canInvite={canInvite} inviteVenue={inviteVenue} />
        {profile.chatError ? <p role="alert" className="border-b border-divider bg-danger-surface px-4 py-2 text-xs text-danger-foreground">{profile.chatError}</p> : null}
        <ProfileInfo profile={profile.profile} tab={profile.selectedTab} expandedSections={profile.expandedSections} onToggleSection={profile.toggleSection} />
        {isSquareAccount ? <SquareLocationCard profile={profile.profile} /> : null}
        {isSquareAccount ? <SquareSchedule items={profile.profile.schedule} canManage={canManage} /> : null}
        <ProfileActivity posts={profile.narrativePosts} replies={profile.profile.replies} likedPostIds={profile.likedNarrativeIds} onLike={(postId) => void profile.toggleLike(postId)} onShare={(post) => void profile.shareNarrative(post)} />
      </div>
      {profile.isLoading ? <p className="px-4 text-xs text-muted-foreground">در حال دریافت پروفایل…</p> : null}
      {canManage && profile.isManagementOpen ? (
        <div role="dialog" aria-modal="true" aria-label="مدیریت میدان" className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div className="w-full max-w-sm rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog">
            <div className="flex items-center justify-between"><h2 className="text-sm font-black text-foreground">{isSquare ? "مدیریت میدانی پایگاه" : "ویرایش پروفایل"}</h2><button type="button" onClick={profile.closeManagement} aria-label="بستن" className="grid h-10 w-10 place-items-center rounded-control text-icon-muted transition-colors hover:bg-hover hover:text-brand"><X className="h-5 w-5" /></button></div>
            <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); const input = { name, subtitle, about, skills: skills.split(/[،,]/).map((item) => item.trim()).filter(Boolean) }; void (isSquare ? profile.saveSquareDetails(input) : profile.saveUserDetails(input)); }}>
              <label className="block text-xs font-bold text-foreground-secondary">{isSquare ? "نام میدان" : "نام"}<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-control border border-input-border bg-input px-3 text-sm text-foreground outline-none focus:border-brand" /></label>
              <label className="block text-xs font-bold text-foreground-secondary">معرفی کوتاه<input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-control border border-input-border bg-input px-3 text-sm text-foreground outline-none focus:border-brand" /></label>
              <label className="block text-xs font-bold text-foreground-secondary">درباره میدان<textarea value={about} onChange={(event) => setAbout(event.target.value)} className="mt-1.5 min-h-20 w-full resize-none rounded-control border border-input-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-brand" /></label>
              <label className="block text-xs font-bold text-foreground-secondary">توانمندی‌ها<input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="با ، جدا کنید" className="mt-1.5 min-h-10 w-full rounded-control border border-input-border bg-input px-3 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-brand" /></label>
              <button type="submit" disabled={profile.isSavingManagement} className="min-h-10 w-full rounded-pill bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:bg-disabled">{profile.isSavingManagement ? "در حال ذخیره…" : "ذخیره مشخصات"}</button>
            </form>
            {isSquare ? (
              <Link
                href={"/profile/schedule" as Route}
                className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-pill border border-brand-border px-4 text-xs font-black text-brand transition-colors hover:bg-brand-muted"
              >
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                مدیریت سین برنامه
              </Link>
            ) : null}
            {profile.managementError ? <p role="alert" className="mt-3 text-xs text-danger">{profile.managementError}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
