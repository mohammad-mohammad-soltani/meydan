"use client";

import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { SpeakerCard } from "./SpeakerCard";
import { SpeakerProfile } from "./SpeakerProfile";
import { SpeakersFilters } from "./SpeakersFilters";
import { SpeakersSearch } from "./SpeakersSearch";
import { useSpeakers } from "../hooks/useSpeakers";

export function SpeakersView() {
  const speakers = useSpeakers();
  return <section id="view-speakers" className="min-h-full space-y-4 bg-white p-4 pb-24 dark:bg-[#070a0f]"><header className="flex items-start justify-between border-b border-slate-200 pb-3 dark:border-slate-800"><div className="flex items-start gap-2"><Link href="/content" aria-label="بازگشت به محتوا" className="mt-0.5 text-slate-500 transition hover:text-brand-red"><ArrowRight className="h-5 w-5" /></Link><div><h1 className="text-sm font-black text-slate-950 dark:text-white">فهرست خطبا و سخنرانان جهاد تبیین</h1><p className="mt-1 text-[10px] text-slate-500">جستجو، بررسی سوابق و ثبت درخواست اعزام به میدان</p></div></div><span className="shrink-0 rounded bg-brand-red/10 px-2 py-0.5 text-[10px] font-bold text-brand-red">۳۴ استاد آماده</span></header><SpeakersSearch value={speakers.query} onChange={speakers.setQuery} /><SpeakersFilters activeFilter={speakers.filter} onChange={speakers.setFilter} /><div className="divide-y divide-slate-100 dark:divide-slate-800/60">{speakers.isLoading ? <p className="py-6 text-center text-xs text-slate-500">در حال دریافت فهرست…</p> : speakers.speakers.length ? speakers.speakers.map((speaker) => <SpeakerCard key={speaker.id} speaker={speaker} onOpen={() => speakers.openSpeaker(speaker)} />) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700">سخنرانی با این مشخصات پیدا نشد.</div>}</div><SpeakerProfile speaker={speakers.selectedSpeaker} request={speakers.request} reservation={speakers.reservation} onClose={speakers.closeProfile} onRequestChange={speakers.updateRequest} onSubmit={speakers.submitReservation} /></section>;
}