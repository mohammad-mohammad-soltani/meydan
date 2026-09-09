"use client";

import { useMemo, useState } from "react";
import { meydanApi } from "@/lib/meydan-api";
import type { ReservationRequest, ReservationResult, Speaker, SpeakerFilter } from "../types";

const initialRequest: ReservationRequest = { venue: "میدان انقلاب تهران", timeSlot: "امشب - ساعت ۲۱:۰۰" };

export function useSpeakers(initialSpeakers: Speaker[]) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SpeakerFilter>("all");
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [request, setRequest] = useState<ReservationRequest>(initialRequest);
  const [reservation, setReservation] = useState<ReservationResult | null>(null);
  const [isLoading] = useState(false);

  const speakers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa-IR");
    return initialSpeakers.filter((speaker) => {
      const matchesFilter = filter === "all" || speaker.category === filter;
      const haystack = [speaker.name, speaker.handle, speaker.cities.join(" "), speaker.expertise].join(" ").toLocaleLowerCase("fa-IR");
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [filter, initialSpeakers, query]);

  const openSpeaker = (speaker: Speaker) => { setSelectedSpeaker(speaker); setReservation(null); };
  const closeProfile = () => { setSelectedSpeaker(null); setReservation(null); };
  const updateRequest = (field: keyof ReservationRequest, value: string) => setRequest((current) => ({ ...current, [field]: value }));
  const submitReservation = async () => {
    if (!selectedSpeaker) return;
    try {
      const result = await meydanApi<{ created_at?: string }>("/speaker-requests", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ creator_id: Number(selectedSpeaker.id), venue: request.venue, requested_at: new Date().toISOString(), note: request.timeSlot }),
      });
      setReservation({ speakerId: selectedSpeaker.id, submittedAt: result.created_at || new Date().toISOString() });
    } catch { return; }
  };

  return { query, filter, speakers, selectedSpeaker, request, reservation, isLoading, setQuery, setFilter, openSpeaker, closeProfile, updateRequest, submitReservation };
}
