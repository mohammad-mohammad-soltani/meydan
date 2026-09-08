import { Send } from "lucide-react";

type CommentInputProps = { value: string; onChange: (value: string) => void; onSubmit: () => void; };

export function CommentInput({ value, onChange, onSubmit }: CommentInputProps) {
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-slate-800 dark:bg-[#070a0f]/95"><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="پاسخ یا نظر خود را بنویسید..." className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-red dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" /><button type="submit" aria-label="ارسال نظر" className="rounded-xl bg-brand-red p-2.5 text-white transition hover:bg-red-700"><Send className="h-4 w-4" /></button></form>;
}