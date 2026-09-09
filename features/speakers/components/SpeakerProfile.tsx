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
  const fieldClass = "mt-1.5 w-full rounded-control border border-input-border bg-input px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div role="dialog" aria-modal="true" aria-label="درخواست اعزام سخنران" className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 sm:items-center">
      <section className="w-full max-w-md rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog">
        <div className="flex items-start justify-between"><div><div className="flex items-center gap-1"><h2 className="text-sm font-black text-foreground">{speaker.name}</h2><BadgeCheck className="h-4 w-4 fill-verified text-on-solid" /></div><p className="mt-1 text-xs text-muted-foreground">درخواست رسمی اعزام به میدان</p></div><button type="button" onClick={onClose} aria-label="بستن" className="grid h-10 w-10 place-items-center rounded-control text-icon-muted transition-colors hover:bg-hover hover:text-brand"><X className="h-5 w-5" /></button></div>
        {reservation ? <div className="mt-5 rounded-control border border-success-border bg-success-surface p-4 text-sm font-bold text-success-foreground">درخواست اعزام ثبت شد و برای هماهنگی ارسال می‌شود.</div> : (
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-foreground-secondary">پایگاه متقاضی<input value={request.venue} onChange={(event) => onRequestChange("venue", event.target.value)} className={fieldClass} /></label>
            <label className="block text-xs font-bold text-foreground-secondary">زمان منبر<select value={request.timeSlot} onChange={(event) => onRequestChange("timeSlot", event.target.value)} className={fieldClass}><option>امشب - ساعت ۲۱:۰۰</option><option>فردا شب - ساعت ۲۱:۰۰</option></select></label>
            <button type="button" onClick={onSubmit} className="flex w-full items-center justify-center gap-2 rounded-control bg-brand py-2.5 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"><Send className="h-4 w-4" />ثبت و ارسال دعوت‌نامه</button>
          </div>
        )}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-foreground-subtle"><CalendarClock className="h-4 w-4" />هماهنگی نهایی پس از بررسی ظرفیت انجام می‌شود.</div>
      </section>
    </div>
  );
}
