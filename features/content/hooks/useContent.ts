"use client";

import { useMemo, useState } from "react";
import { getContentItems, getContentQuickActions, getScheduleItems } from "../services/content.service";
import type { ContentCategory, ContentFilter, ContentItem } from "../types";

const initialItems = getContentItems();
const initialSchedule = getScheduleItems();
const initialQuickActions = getContentQuickActions();

export function useContent() {
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>("featured");
  const [selectedFilter, setSelectedFilter] = useState<ContentFilter>("all");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading] = useState(false);

  const items = useMemo(() => initialItems.filter((item) => {
    const categoryMatches = selectedCategory === "schedule" ? false : selectedCategory === "featured" ? item.category === "featured" : item.category === selectedCategory;
    const filterMatches = selectedFilter === "all" || item.status === selectedFilter;
    return categoryMatches && filterMatches;
  }), [selectedCategory, selectedFilter]);

  return {
    selectedCategory,
    selectedFilter,
    selectedItem,
    isPlaying,
    isLoading,
    items,
    scheduleItems: initialSchedule,
    quickActions: initialQuickActions,
    setSelectedCategory,
    setSelectedFilter,
    openPreview: setSelectedItem,
    closePreview: () => { setSelectedItem(null); setIsPlaying(false); },
    togglePlayback: () => setIsPlaying((current) => !current)
  };
}