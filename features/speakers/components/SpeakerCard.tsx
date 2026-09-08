import { speakerAvatar } from "@/components/shared/generated-media";
import Image from "next/image";
import { BadgeCheck, ChevronLeft } from "lucide-react";
import type { Speaker } from "../types";

type SpeakerCardProps = { speaker: Speaker; onOpen: () => void; };

export function SpeakerCard({ speaker, onOpen }: SpeakerCardProps) {
  return <article className="flex items-start justify-between gap-3 border-b border-slate-100 py-4 last:border-b-0 dark:border-slate-800/60"><div className="flex min-w-0 gap-3"><Image src={speakerAvatar(speaker.accent)} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" /><div className="min-w-0"><div className="flex items-center gap-1"><h2 className="truncate text-xs font-black text-slate-950 dark:text-white">{speaker.name}</h2>{speaker.verified ? <BadgeCheck aria-label="حساب تأییدشده" className="h-3.5 w-3.5 shrink-0 fill-blue-500 text-white" /> : null}</div><p className="mt-1 text-[11px] text-slate-400"><span dir="ltr">@{speaker.handle}</span> · {speaker.cities.join(" / ")}</p><p className="mt-1.5 text-[11px] leading-6 text-slate-600 dark:text-slate-300">تخصص: {speaker.expertise}</p></div></div><button type="button" onClick={onOpen} className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-black text-white transition hover:bg-brand-red dark:bg-white dark:text-slate-900 dark:hover:bg-brand-red dark:hover:text-white">درخواست منبر<ChevronLeft className="h-3.5 w-3.5" /></button></article>;
}
