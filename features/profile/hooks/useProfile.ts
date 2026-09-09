"use client";

import { useState } from "react";
import { meydanApi } from "@/lib/meydan-api";
import type { ProfileDetails, ProfileSection } from "../types";

export function useProfile(profile: ProfileDetails) {
  const selectedTab = profile.initialTab ?? "square";
  const [expandedSections, setExpandedSections] = useState<Set<ProfileSection>>(() => new Set(["about"]));
  const [isFollowing, setIsFollowing] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [likedActivity, setLikedActivity] = useState(false);
  const [repostedActivity, setRepostedActivity] = useState(false);
  const [isLoading] = useState(false);
  const [isSavingManagement, setIsSavingManagement] = useState(false);
  const [managementError, setManagementError] = useState<string | null>(null);

  const toggleSection = (section: ProfileSection) => setExpandedSections((current) => {
    const next = new Set(current);
    if (next.has(section)) next.delete(section); else next.add(section);
    return next;
  });

  const toggleFollowing = async () => {
    const next = !isFollowing;
    setIsFollowing(next);
    try { await meydanApi(`/actors/square/${profile.actorId}/follow`, { method: next ? "PUT" : "DELETE" }); } catch { setIsFollowing(!next); }
  };
  const toggleLike = async () => {
    if (profile.activity.id === "none") return;
    const next = !likedActivity;
    setLikedActivity(next);
    try { await meydanApi(`/narratives/${profile.activity.id}/like`, { method: next ? "PUT" : "DELETE" }); } catch { setLikedActivity(!next); }
  };
  const toggleRepost = async () => {
    if (profile.activity.id === "none") return;
    const next = !repostedActivity;
    setRepostedActivity(next);
    try { await meydanApi(`/narratives/${profile.activity.id}/repost`, { method: next ? "PUT" : "DELETE" }); } catch { setRepostedActivity(!next); }
  };
  const saveSquareDetails = async (input: { name: string; subtitle: string; about: string; skills: string[] }) => {
    setIsSavingManagement(true);
    setManagementError(null);
    try {
      await meydanApi("/me/square", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          subtitle: input.subtitle,
          profile_about: input.about,
          profile_skills: input.skills,
        }),
      });
      window.location.reload();
    } catch {
      setManagementError("ذخیره‌سازی انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsSavingManagement(false);
    }
  };
  const createSchedule = async (input: { title: string; startsAt: string }) => {
    setIsSavingManagement(true);
    setManagementError(null);
    try {
      await meydanApi("/me/square/schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: input.title, starts_at: input.startsAt }),
      });
      window.location.reload();
    } catch {
      setManagementError("ثبت برنامه انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsSavingManagement(false);
    }
  };
  return { profile, selectedTab, expandedSections, isFollowing, isManagementOpen, likedActivity, repostedActivity, isLoading, isSavingManagement, managementError, toggleSection, toggleFollowing, openManagement: () => setIsManagementOpen(true), closeManagement: () => setIsManagementOpen(false), toggleLike, toggleRepost, saveSquareDetails, createSchedule };
}
