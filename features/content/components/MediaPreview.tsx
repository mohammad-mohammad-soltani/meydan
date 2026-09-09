import { FileText, Headphones, Image as ImageIcon, Pause, Play, X } from "lucide-react";
import type { ContentItem } from "../types";

type MediaPreviewProps = { item: ContentItem | null; isPlaying: boolean; onClose: () => void; onTogglePlayback: () => void; };

const icons = { image: ImageIcon, audio: Headphones, document: FileText };

export function MediaPreview({ item, isPlaying, onClose, onTogglePlayback }: MediaPreviewProps) {
  if (!item) return null;
  const Icon = icons[item.media.kind];
  return <div role="dialog" aria-modal="true" aria-label="پیش‌نمایش محتوا" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#0b0f17]"><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red/10 text-brand-red"><Icon className="h-5 w-5" /></div><button type="button" onClick={onClose} aria-label="بستن" className="rounded-lg p-1 text-slate-400 hover:text-brand-red"><X className="h-5 w-5" /></button></div><h2 className="mt-4 text-base font-black leading-7 text-slate-950 dark:text-white">{item.title}</h2><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>{item.media.kind === "audio" ? <button type="button" onClick={onTogglePlayback} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 text-sm font-black text-white">{isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}{isPlaying ? "توقف پیش‌نمایش" : "پخش پیش‌نمایش"}</button> : <p className="mt-5 rounded-xl bg-slate-100 px-3 py-3 text-xs text-slate-500 dark:bg-slate-900">این پیش‌نمایش برای اتصال به منبع رسانه‌ای واقعی آماده است.</p>}</div></div>;
}