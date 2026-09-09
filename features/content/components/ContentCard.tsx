import { generatedMedia } from "@/components/shared/generated-media";
import Image from "next/image";
import { FileText, Headphones, Image as ImageIcon, Play, Sparkles } from "lucide-react";
import type { ContentItem } from "../types";

type ContentCardProps = { item: ContentItem; onOpenPreview: () => void; };

const mediaIcons = { image: ImageIcon, audio: Headphones, document: FileText };

export function ContentCard({ item, onOpenPreview }: ContentCardProps) {
  const Icon = mediaIcons[item.media.kind];
  const hero = item.category === "featured";

  return (
    <article className={`overflow-hidden rounded-card border border-border bg-card text-card-foreground ${hero ? "shadow-card" : "shadow-xs"}`}>
      {hero ? (
        <div className="relative min-h-48 overflow-hidden bg-surface-sunken p-5 text-on-solid">
          <Image src={generatedMedia.contentHero} alt="" fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-scrim via-overlay to-transparent" />
          <Sparkles className="relative h-6 w-6 text-warning" />
          <span className="relative mt-5 inline-flex rounded-md bg-brand px-2 py-1 text-[10px] font-black text-brand-foreground">{item.badge}</span>
          <h2 className="relative mt-2 text-base font-black leading-7">{item.title}</h2>
          <p className="relative mt-2 text-xs leading-6 text-on-solid/80">{item.subtitle}</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-muted text-brand"><Icon className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-muted-foreground">{item.author ?? item.subtitle}</p><h2 className="mt-1 text-sm font-black leading-6 text-foreground">{item.title}</h2><p className="mt-1 text-xs text-muted-foreground">{item.media.duration ?? item.media.description}</p></div>
        </div>
      )}
      <div className="p-4 pt-3">
        <p className="text-xs leading-7 text-foreground-secondary">{item.description}</p>
        <button type="button" onClick={onOpenPreview} className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-control bg-surface-muted px-3 py-2 text-xs font-black text-foreground-secondary transition-colors hover:bg-brand hover:text-brand-foreground">
          {item.media.kind === "audio" ? <Play className="h-4 w-4 fill-current" /> : <Icon className="h-4 w-4" />}
          {item.media.kind === "document" ? "دریافت فیش" : item.media.kind === "audio" ? "پیش‌نمایش صوت" : "مشاهده محتوا"}
        </button>
      </div>
    </article>
  );
}
