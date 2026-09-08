import { BadgeCheck, CalendarClock, Send, X } from "lucide-react";
import type { ReservationRequest, ReservationResult, Speaker } from "../types";

type SpeakerProfileProps = {
  speaker: Speaker | null;
  request: ReservationRequest;
  reservation: ReservationResult | null;
  onClose: () => void;
  onRequestChange: (field: keyof ReservationRequest, value: string) => void;
  onSubmit: () => void;
};

export function SpeakerProfile({ speaker, request, reservation, onClose, onRequestChange, onSubmit }: SpeakerProfileProps) {
  if (!speaker) return null;
  return <div role="dialog" aria-modal="true" aria-label="درخواست اعزام سخنران" className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#0b0f17]"><div className="flex items-start justify-between"><div><div className="flex items-center gap-1"><h2 className="text-sm font-black text-slate-950 dark:text-white">{speaker.name}</h2><BadgeCheck className="h-4 w-4 fill-blue-500 text-white" /></div><p className="mt-1 text-xs text-slate-500">درخواست رسمی اعزام به میدان</p></div><button type="button" onClick={onClose} aria-label="بستن" className="rounded-lg p-1 text-slate-400 hover:text-brand-red"><X className="h-5 w-5" /></button></div>{reservation ? <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700 dark:text-emerald-400">درخواست اعزام ثبت شد و برای هماهنگی ارسال می‌شود.</div> : <div className="mt-5 space-y-3"><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">پایگاه متقاضی<input value={request.venue} onChange={(event) => onRequestChange("venue", event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-red dark:border-slate-800 dark:bg-slate-900 dark:text-white" /></label><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">زمان منبر<select value={request.timeSlot} onChange={(event) => onRequestChange("timeSlot", event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-red dark:border-slate-800 dark:bg-slate-900 dark:text-white"><option>امشب - ساعت ۲۱:۰۰</option><option>فردا شب - ساعت ۲۱:۰۰</option></select></label><button type="button" onClick={onSubmit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red py-2.5 text-xs font-black text-white transition hover:bg-red-700"><Send className="h-4 w-4" />ثبت و ارسال دعوت‌نامه</button></div>}<div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarClock className="h-4 w-4" />هماهنگی نهایی پس از بررسی ظرفیت انجام می‌شود.</div></section></div>;
}