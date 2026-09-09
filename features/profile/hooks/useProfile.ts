"use client";

import { useState } from "react";
import { meydanClientApi, requireLogin } from "@/lib/meydan-client-api";
import type { ProfileDetails, ProfileSection } from "../types";

export function useProfile(profile: ProfileDetails) {
  const selectedTab = profile.initialTab ?? "square";
  const [expandedSections, setExpandedSections] = useState<Set<ProfileSection>>(() => new Set(["about"]));
  const [isFollowing, setIsFollowing] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [likedActivity, setLikedActivity] = useState(Boolean(profile.activity.viewerState?.liked));
  const [repostedActivity, setRepostedActivity] = useState(Boolean(profile.activity.viewerState?.reposted));
  const [isLoading, setIsLoading] = useState(false);

  const toggleSection = (section: ProfileSection) => setExpandedSections((current) => {
    const next = new Set(current);
    if (next.has(section)) next.delete(section); else next.add(section);
    return next;
  });

  const toggleLike = async () => {
    if (profile.activity.id === "none") return;
    const before = likedActivity;
    setLikedActivity(!before);
    setIsLoading(true);
    try {
      await meydanClientApi(`/narratives/${profile.activity.id}/like`, { method: before ? "DELETE" : "PUT" });
    } catch (error) {
      setLikedActivity(before);
      requireLogin(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRepost = async () => {
    if (profile.activity.id === "none") return;
    const before = repostedActivity;
    setRepostedActivity(!before);
    setIsLoading(true);
    try {
      await meydanClientApi(`/narratives/${profile.activity.id}/repost`, { method: before ? "DELETE" : "PUT" });
    } catch (error) {
      setRepostedActivity(before);
      requireLogin(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    selectedTab,
    expandedSections,
    isFollowing,
    isManagementOpen,
    likedActivity,
    repostedActivity,
    isLoading,
    toggleSection,
    toggleFollowing: () => setIsFollowing((current) => !current),
    openManagement: () => setIsManagementOpen(true),
    closeManagement: () => setIsManagementOpen(false),
    toggleLike,
    toggleRepost,
  };
}
