import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import type { Speaker } from "../types";

type SpeakerCardProps = { speaker: Speaker; onOpen: () => void; };

export function SpeakerCard({ speaker, onOpen }: SpeakerCardProps) {
  return (
    <article className="flex items-start justify-between gap-3 border-b border-divider py-4 last:border-b-0">
      <div className="flex min-w-0 gap-3">{speaker.avatarUrl ? <Image src={speaker.avatarUrl} alt="" width={44} height={44} unoptimized={speaker.avatarUrl.startsWith("http")} className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-black text-icon">{speaker.initials.slice(0, 1)}</span>}<div className="min-w-0"><div className="flex items-center gap-1"><h2 className="truncate text-xs font-black text-foreground">{speaker.name}</h2><SpeakerBadge verified={speaker.verified} /></div><p className="mt-1 text-[11px] text-foreground-subtle"><span dir="ltr">@{speaker.handle}</span> · {speaker.cities.join(" / ")}</p><p className="mt-1.5 text-[11px] leading-6 text-foreground-secondary">تخصص: {speaker.expertise}</p></div></div>
      <button type="button" onClick={onOpen} className="inline-flex shrink-0 items-center gap-0.5 rounded-pill bg-solid-dark px-3 py-1.5 text-xs font-black text-on-solid transition-colors hover:bg-brand dark:bg-solid-light dark:text-on-light dark:hover:bg-brand dark:hover:text-brand-foreground">درخواست منبر<ChevronLeft className="h-3.5 w-3.5" /></button>
    </article>
  );
}
