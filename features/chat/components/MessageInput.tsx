import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

type MessageInputProps = {
  value: string;
  isSending: boolean;
  notice: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttachmentRequested: () => void;
};

export function MessageInput({ value, isSending, notice, onChange, onSubmit, onAttachmentRequested }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessage = Boolean(value.trim());

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 108)}px`;
  }, [value]);

  return (
    <footer className="shrink-0 bg-transparent px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2">
      <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <div className="chat-composer-glass flex min-w-0 flex-1 items-end gap-1 rounded-[22px] border border-white/70 bg-white/60 px-2 shadow-[0_8px_28px_rgba(60,90,105,.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#202c33]/70 dark:shadow-[0_8px_28px_rgba(0,0,0,.25)]">
          <button type="button" aria-label="افزودن فایل" onClick={onAttachmentRequested} className="mb-0.5 rounded-full p-2 text-slate-500 hover:bg-white/50 dark:text-[#a9bac4] dark:hover:bg-white/10"><Paperclip className="h-5 w-5" /></button>
          <textarea ref={textareaRef} rows={1} value={value} onChange={(event) => onChange(event.target.value)} placeholder="پیام بنویسید" className="max-h-[108px] min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-[13px] leading-5 text-slate-800 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-slate-500 dark:text-[#e9edef] dark:placeholder:text-[#9babb4]" />
          <button type="button" aria-label="انتخاب شکلک" className="mb-0.5 rounded-full p-2 text-slate-500 hover:bg-white/50 dark:text-[#a9bac4] dark:hover:bg-white/10"><Smile className="h-5 w-5" /></button>
          {hasMessage ? <button type="submit" disabled={isSending} aria-label="ارسال پیام" className="mb-0.5 rounded-full p-2 text-[#5c9edb] transition hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#8ebfe2] dark:hover:bg-white/10"><SendHorizontal className="h-5 w-5" /></button> : null}
        </div>
      </form>
      {notice ? <p className="mx-2 mt-1.5 rounded-lg bg-white/70 px-2 py-1 text-[10px] text-slate-600 backdrop-blur dark:bg-[#202c33]/75 dark:text-[#a9bac4]">{notice}</p> : null}
    </footer>
  );
}
