"use client";

import { X } from "lucide-react";
import { ProfileActions } from "./ProfileActions";
import { ProfileActivity } from "./ProfileActivity";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileTabs } from "./ProfileTabs";
import { useProfile } from "../hooks/useProfile";

export function ProfileView() {
  const profile = useProfile();
  return <section id="view-combined-profile" className="min-h-full space-y-4 bg-white pb-20 dark:bg-[#070a0f]"><ProfileHeader identity={profile.profile.identity} /><ProfileActions isFollowing={profile.isFollowing} onToggleFollowing={profile.toggleFollowing} onOpenManagement={profile.openManagement} /><ProfileTabs activeTab={profile.selectedTab} onChange={profile.setSelectedTab} /><ProfileInfo profile={profile.profile} tab={profile.selectedTab} expandedSections={profile.expandedSections} onToggleSection={profile.toggleSection} />{profile.selectedTab === "square" ? <ProfileActivity activity={profile.profile.activity} liked={profile.likedActivity} reposted={profile.repostedActivity} onLike={profile.toggleLike} onRepost={profile.toggleRepost} /> : null}{profile.isLoading ? <p className="px-4 text-xs text-slate-500">در حال دریافت پروفایل…</p> : null}{profile.isManagementOpen ? <div role="dialog" aria-modal="true" aria-label="مدیریت میدان" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#0b0f17]"><div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-950 dark:text-white">مدیریت میدانی پایگاه</h2><button type="button" onClick={profile.closeManagement} aria-label="بستن" className="p-1 text-slate-400 hover:text-brand-red"><X className="h-5 w-5" /></button></div><p className="mt-3 text-xs leading-7 text-slate-600 dark:text-slate-300">پنل هماهنگی صوت، موکب، رزرو سخنران و ثبت اخبار رسمی پس از اتصال به سرویس مدیریت میدان در اینجا فعال می‌شود.</p></div></div> : null}</section>;
}