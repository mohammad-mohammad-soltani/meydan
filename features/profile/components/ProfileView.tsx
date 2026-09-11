"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ProfileActivity } from "./ProfileActivity";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInfo } from "./ProfileInfo";
import { SquareLocationCard } from "./SquareLocationCard";
import { SquareSchedule } from "./SquareSchedule";
import { useProfile } from "../hooks/useProfile";
import type { ProfileDetails } from "../types";

export function ProfileView({ initialProfile, canManage = true }: { initialProfile: ProfileDetails; canManage?: boolean }) {
  const profile = useProfile(initialProfile, canManage);
  const isSquare = profile.selectedTab === "square";
  const isSquareAccount = profile.profile.accountType === "square";
  const [name, setName] = useState(initialProfile.identity.name);
  const [subtitle, setSubtitle] = useState(initialProfile.identity.subtitle);
  const [about, setAbout] = useState(initialProfile.about);
  const [skills, setSkills] = useState(initialProfile.skills.join("، "));
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleStartsAt, setScheduleStartsAt] = useState("");

  return (
    <section id="view-combined-profile" className="min-h-dvh bg-background pb-20 text-foreground">
      <div className="mx-auto w-full max-w-2xl border-x border-divider bg-surface">
        <ProfileHeader profile={profile.profile} canEdit={canManage} isFollowing={profile.isFollowing} isFollowLoading={profile.isFollowLoading} followStateReady={profile.followStateReady} onToggleFollow={() => void profile.toggleFollowing()} />
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
            {isSquare ? <form className="mt-5 border-t border-divider pt-4" onSubmit={(event) => { event.preventDefault(); if (scheduleTitle && scheduleStartsAt) void profile.createSchedule({ title: scheduleTitle, startsAt: scheduleStartsAt }); }}>
              <p className="text-xs font-black text-foreground">ثبت برنامه جدید</p>
              <input required value={scheduleTitle} onChange={(event) => setScheduleTitle(event.target.value)} placeholder="عنوان برنامه" className="mt-2 min-h-10 w-full rounded-control border border-input-border bg-input px-3 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-brand" />
              <input required type="datetime-local" value={scheduleStartsAt} onChange={(event) => setScheduleStartsAt(event.target.value)} className="mt-2 min-h-10 w-full rounded-control border border-input-border bg-input px-3 text-xs text-foreground outline-none focus:border-brand" />
              <button type="submit" disabled={profile.isSavingManagement} className="mt-2 min-h-10 w-full rounded-pill border border-brand-border px-4 text-xs font-black text-brand transition-colors hover:bg-brand-muted disabled:border-disabled disabled:text-disabled-foreground">ثبت برنامه</button>
            </form> : null}
            {profile.managementError ? <p role="alert" className="mt-3 text-xs text-danger">{profile.managementError}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
