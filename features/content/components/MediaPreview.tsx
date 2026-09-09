import { FileText, Headphones, Image as ImageIcon, Pause, Play, X } from "lucide-react";
import type { ContentItem } from "../types";

type MediaPreviewProps = { item: ContentItem | null; isPlaying: boolean; onClose: () => void; onTogglePlayback: () => void; };

const icons = { image: ImageIcon, audio: Headphones, document: FileText };

export function MediaPreview({ item, isPlaying, onClose, onTogglePlayback }: MediaPreviewProps) {
  if (!item) return null;
  const Icon = icons[item.media.kind];

  return (
    <div role="dialog" aria-modal="true" aria-label="پیش‌نمایش محتوا" className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog">
        <div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-muted text-brand"><Icon className="h-5 w-5" /></div><button type="button" onClick={onClose} aria-label="بستن" className="grid h-10 w-10 place-items-center rounded-control text-icon-muted transition-colors hover:bg-hover hover:text-brand"><X className="h-5 w-5" /></button></div>
        <h2 className="mt-4 text-base font-black leading-7 text-foreground">{item.title}</h2>
        <p className="mt-2 text-sm leading-7 text-foreground-secondary">{item.description}</p>
        {item.media.kind === "audio" ? <button type="button" onClick={onTogglePlayback} className="mt-5 flex w-full items-center justify-center gap-2 rounded-control bg-brand px-4 py-3 text-sm font-black text-brand-foreground transition-colors hover:bg-brand-hover">{isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}{isPlaying ? "توقف پیش‌نمایش" : "پخش پیش‌نمایش"}</button> : <p className="mt-5 rounded-control bg-surface-muted px-3 py-3 text-xs text-muted-foreground">این پیش‌نمایش برای اتصال به منبع رسانه‌ای واقعی آماده است.</p>}
      </div>
    </div>
  );
}
