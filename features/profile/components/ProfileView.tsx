"use client";

import { X } from "lucide-react";
import { ProfileActions } from "./ProfileActions";
import { ProfileActivity } from "./ProfileActivity";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileTabs } from "./ProfileTabs";
import { useProfile } from "../hooks/useProfile";
import type { ProfileDetails } from "../types";

export function ProfileView({ initialProfile }: { initialProfile: ProfileDetails }) {
  const profile = useProfile(initialProfile);
  return (
    <section id="view-combined-profile" className="min-h-full space-y-4 bg-background pb-20 text-foreground">
      <ProfileHeader identity={profile.profile.identity} />
      <ProfileActions isFollowing={profile.isFollowing} onToggleFollowing={profile.toggleFollowing} onOpenManagement={profile.openManagement} />
      <ProfileTabs activeTab={profile.selectedTab} onChange={profile.setSelectedTab} />
      <ProfileInfo profile={profile.profile} tab={profile.selectedTab} expandedSections={profile.expandedSections} onToggleSection={profile.toggleSection} />
      {profile.selectedTab === "square" ? <ProfileActivity activity={profile.profile.activity} liked={profile.likedActivity} reposted={profile.repostedActivity} onLike={profile.toggleLike} onRepost={profile.toggleRepost} /> : null}
      {profile.isLoading ? <p className="px-4 text-xs text-muted-foreground">در حال دریافت پروفایل…</p> : null}
      {profile.isManagementOpen ? (
        <div role="dialog" aria-modal="true" aria-label="مدیریت میدان" className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div className="w-full max-w-sm rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog">
            <div className="flex items-center justify-between"><h2 className="text-sm font-black text-foreground">مدیریت میدانی پایگاه</h2><button type="button" onClick={profile.closeManagement} aria-label="بستن" className="grid h-10 w-10 place-items-center rounded-control text-icon-muted transition-colors hover:bg-hover hover:text-brand"><X className="h-5 w-5" /></button></div>
            <p className="mt-3 text-xs leading-7 text-foreground-secondary">پنل هماهنگی صوت، موکب، رزرو سخنران و ثبت اخبار رسمی پس از اتصال به سرویس مدیریت میدان در اینجا فعال می‌شود.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
