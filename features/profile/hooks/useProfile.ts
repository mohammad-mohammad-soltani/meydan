"use client";

import { useState } from "react";
import { getProfileDetails } from "../services/profile.service";
import type { ProfileSection, ProfileTab } from "../types";

const profile = getProfileDetails();

export function useProfile() {
  const [selectedTab, setSelectedTab] = useState<ProfileTab>("square");
  const [expandedSections, setExpandedSections] = useState<Set<ProfileSection>>(() => new Set(["about"]));
  const [isFollowing, setIsFollowing] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [likedActivity, setLikedActivity] = useState(false);
  const [repostedActivity, setRepostedActivity] = useState(false);
  const [isLoading] = useState(false);

  const toggleSection = (section: ProfileSection) => setExpandedSections((current) => {
    const next = new Set(current);
    if (next.has(section)) next.delete(section); else next.add(section);
    return next;
  });

  return { profile, selectedTab, expandedSections, isFollowing, isManagementOpen, likedActivity, repostedActivity, isLoading, setSelectedTab, toggleSection, toggleFollowing: () => setIsFollowing((current) => !current), openManagement: () => setIsManagementOpen(true), closeManagement: () => setIsManagementOpen(false), toggleLike: () => setLikedActivity((current) => !current), toggleRepost: () => setRepostedActivity((current) => !current) };
}