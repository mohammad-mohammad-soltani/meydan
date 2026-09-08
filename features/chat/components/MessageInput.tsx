import { Paperclip, Send } from "lucide-react";

type MessageInputProps = {
  value: string;
  isSending: boolean;
  notice: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttachmentRequested: () => void;
};

export function MessageInput({ value, isSending, notice, onChange, onSubmit, onAttachmentRequested }: MessageInputProps) {
  return <footer className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-[#070a0f]"><form className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 dark:border-slate-800 dark:bg-slate-900" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><button type="button" aria-label="افزودن فایل" onClick={onAttachmentRequested} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-brand-red dark:hover:bg-slate-800"><Paperclip className="h-4.5 w-4.5" /></button><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="پیام بنویسید..." className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100" /><button type="submit" disabled={!value.trim() || isSending} aria-label="ارسال پیام" className="rounded-xl bg-brand-red p-2 text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button></form>{notice ? <p className="px-1 pt-1.5 text-[10px] text-slate-500 dark:text-slate-400">{notice}</p> : null}</footer>;
}
