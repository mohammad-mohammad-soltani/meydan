"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SpeakerCard } from "./SpeakerCard";
import { SpeakerProfile } from "./SpeakerProfile";
import { SpeakersFilters } from "./SpeakersFilters";
import { SpeakersSearch } from "./SpeakersSearch";
import { useSpeakers } from "../hooks/useSpeakers";
import type { Speaker } from "../types";

export function SpeakersView({ initialSpeakers }: { initialSpeakers: Speaker[] }) {
  const speakers = useSpeakers(initialSpeakers);
  return (
    <section id="view-speakers" className="min-h-full space-y-4 bg-background p-4 pb-24 text-foreground">
      <header className="flex items-start justify-between border-b border-divider pb-3">
        <div className="flex items-start gap-2"><Link href="/content" aria-label="بازگشت به محتوا" className="mt-0.5 text-icon-muted transition-colors hover:text-brand"><ArrowRight className="h-5 w-5" /></Link><div><h1 className="text-sm font-black text-foreground">فهرست خطبا و سخنرانان جهاد تبیین</h1><p className="mt-1 text-[10px] text-muted-foreground">جستجو، بررسی سوابق و ثبت درخواست اعزام به میدان</p></div></div>
        <span className="shrink-0 rounded bg-brand-muted px-2 py-0.5 text-[10px] font-bold text-brand">۳۴ استاد آماده</span>
      </header>
      <SpeakersSearch value={speakers.query} onChange={speakers.setQuery} />
      <SpeakersFilters activeFilter={speakers.filter} onChange={speakers.setFilter} />
      <div className="divide-y divide-divider">{speakers.isLoading ? <p className="py-6 text-center text-xs text-muted-foreground">در حال دریافت فهرست…</p> : speakers.speakers.length ? speakers.speakers.map((speaker) => <SpeakerCard key={speaker.id} speaker={speaker} onOpen={() => speakers.openSpeaker(speaker)} />) : <div className="rounded-control border border-dashed border-border-strong p-6 text-center text-xs text-muted-foreground">سخنرانی با این مشخصات پیدا نشد.</div>}</div>
      <SpeakerProfile speaker={speakers.selectedSpeaker} request={speakers.request} reservation={speakers.reservation} onClose={speakers.closeProfile} onRequestChange={speakers.updateRequest} onSubmit={() => void speakers.submitReservation()} />
    </section>
  );
}
