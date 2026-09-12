"use client";

import { useMemo, useState } from "react";
import type { Speaker, SpeakerCategory, SpeakerFilter } from "../types";

/**
 * Browse-only: inviting happens in the speaker-invitations feature, which
 * derives the venue from the square's own profile. This hook only filters.
 */
export function useSpeakers(initialSpeakers: Speaker[], categories: SpeakerCategory[] = []) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SpeakerFilter>("all");
  const [isLoading] = useState(false);

  const speakers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa-IR");
    return initialSpeakers.filter((speaker) => {
      const matchesFilter =
        filter === "all" || speaker.categories.some((category) => category.slug === filter);
      const haystack = [speaker.name, speaker.handle, speaker.cities.join(" "), speaker.expertise]
        .join(" ")
        .toLocaleLowerCase("fa-IR");
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [filter, initialSpeakers, query]);

  return { query, filter, categories, speakers, isLoading, setQuery, setFilter };
}
